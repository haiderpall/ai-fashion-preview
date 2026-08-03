import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { encode as base64Encode } from "https://esm.sh/base64-arraybuffer@1.0.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message ?? "no user"}`);
    }

    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const category = formData.get("category") as string || "general";
    const customerName = formData.get("customerName") as string | null;
    const customerEmail = formData.get("customerEmail") as string | null;
    const images = formData.getAll("image") as File[]; // expecting exactly 2: person, garment

    if (!prompt || images.length !== 2) {
      throw new Error("Missing prompt or incorrect number of images (need exactly 2)");
    }

    const [personImage, garmentImage] = images;
    const jobId = crypto.randomUUID();
    const timestamp = Date.now();

    // ---- Hash + upload input images to tryon-uploads (unchanged from before) ----
    const hashFile = async (file: File) => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    };

    const personHash = await hashFile(personImage);
    const garmentHash = await hashFile(garmentImage);

    const personPath = `${user.id}/${personHash}.jpg`;
    const garmentPath = `${user.id}/${garmentHash}.jpg`;

    const uploadFileIfNotExists = async (path: string, file: File) => {
      await supabase.storage.from("tryon-uploads").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
    };

    await Promise.all([
      uploadFileIfNotExists(personPath, personImage),
      uploadFileIfNotExists(garmentPath, garmentImage),
    ]);

    const personUrl = supabase.storage.from("tryon-uploads").getPublicUrl(personPath).data.publicUrl;
    const garmentUrl = supabase.storage.from("tryon-uploads").getPublicUrl(garmentPath).data.publicUrl;

    const { error: insertError } = await supabase.from("tryon_jobs").insert({
      id: jobId,
      user_id: user.id,
      status: "processing",
      person_image_url: personUrl,
      garment_image_url: garmentUrl,
      garment_category: category,
      customer_name: customerName || null,
      customer_email: customerEmail || null,
    });

    if (insertError) throw new Error(`Failed to create tryon_job: ${insertError.message}`);

    // ---- Convert both images to base64 for FLUX's JSON body ----
    const personBase64 = base64Encode(await personImage.arrayBuffer());
    const garmentBase64 = base64Encode(await garmentImage.arrayBuffer());

    const azureUrl = Deno.env.get("AZURE_OPENAI_URL") ?? "";
    const azureKey = Deno.env.get("AZURE_OPENAI_KEY");
    const deployment = Deno.env.get("AZURE_OPENAI_DEPLOYMENT") ?? "FLUX.2-pro";

    if (!azureKey || !azureUrl) {
      throw new Error("Azure/FLUX credentials not configured");
    }

    const requestUrl = `${azureUrl}?api-version=preview`;

    console.log("Submitting FLUX.2-pro request to:", requestUrl);

    const azureResp = await fetch(requestUrl, {
      method: "POST",
      headers: {
        // Confirmed via direct testing: this endpoint expects a Bearer token,
        // NOT the "api-key" header used by the old Azure OpenAI images/edits route.
        Authorization: `Bearer ${azureKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: deployment,
        prompt,
        input_image: personBase64,
        input_image_2: garmentBase64,
        output_format: "jpeg",
      }),
    });

    // Read as text first to avoid a JSON.parse crash masking the real error
    // if Azure returns something non-JSON (gateway errors, timeouts, etc.)
    const rawText = await azureResp.text();
    console.log("FLUX raw response:", rawText);

    let azureData: any;
    try {
      azureData = JSON.parse(rawText);
    } catch {
      throw new Error(`Non-JSON response from FLUX (status ${azureResp.status}): ${rawText.slice(0, 300)}`);
    }

    if (!azureResp.ok) {
      throw new Error(azureData?.error?.message || JSON.stringify(azureData));
    }

    // Confirmed synchronous, OpenAI-compatible response shape: data.data[0]
    if (!azureData.data || azureData.data.length === 0) {
      console.error("Unexpected FLUX response shape:", JSON.stringify(azureData));
      throw new Error("No image returned from FLUX — check function logs for the raw response.");
    }

    const item = azureData.data[0];
    let imageBytes: Uint8Array;
    let contentType = "image/jpeg";

    if (item.b64_json) {
      const cleanBase64 = item.b64_json.replace(/^data:image\/\w+;base64,/, "");
      const binary = atob(cleanBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      imageBytes = bytes;
    } else if (item.url) {
      const imgResp = await fetch(item.url);
      contentType = imgResp.headers.get("content-type") || "image/jpeg";
      imageBytes = new Uint8Array(await imgResp.arrayBuffer());
    } else {
      throw new Error("FLUX result item had neither b64_json nor url.");
    }

    // ---- Upload result to tryon-results (unchanged from before) ----
    const ext = contentType.includes("png") ? "png" : "jpg";
    const resultPath = `${user.id}/${jobId}/result_${timestamp}.${ext}`;

    const { error: resultUploadError } = await supabase.storage
      .from("tryon-results")
      .upload(resultPath, imageBytes, { contentType });

    if (resultUploadError) throw new Error(`Failed to upload result: ${resultUploadError.message}`);

    const resultUrl = supabase.storage.from("tryon-results").getPublicUrl(resultPath).data.publicUrl;

    await supabase.from("tryon_jobs").update({
      status: "succeeded",
      result_image_url: resultUrl,
    }).eq("id", jobId);

    return new Response(JSON.stringify({ url: resultUrl, id: jobId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});