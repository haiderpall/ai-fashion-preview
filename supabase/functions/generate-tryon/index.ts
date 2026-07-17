import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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
      console.error("Auth error detail:", userError);
      throw new Error(`Unauthorized: ${userError?.message ?? "no user"}`);
    }

    const formData = await req.formData();
    const prompt = formData.get("prompt") as string;
    const category = formData.get("category") as string || "general";
    const images = formData.getAll("image") as File[]; // Expecting exactly 2 files (person, garment)
    const customerName = formData.get("customerName") as string | null;
    const customerEmail = formData.get("customerEmail") as string | null;
    if (!prompt || images.length !== 2) {
      throw new Error("Missing prompt or incorrect number of images (need exactly 2)");
    }

    const [personImage, garmentImage] = images;
    const jobId = crypto.randomUUID();
    const timestamp = Date.now();

    // Hash file helper to prevent duplicate uploads
    const hashFile = async (file: File) => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const personHash = await hashFile(personImage);
    const garmentHash = await hashFile(garmentImage);

    // 1. Upload person and garment images to tryon-uploads bucket (needed for tryon_jobs)
    const personPath = `${user.id}/${personHash}.jpg`;
    const garmentPath = `${user.id}/${garmentHash}.jpg`;

    const uploadFileIfNotExists = async (path: string, file: File) => {
      const { error } = await supabase.storage.from("tryon-uploads").upload(path, file, {
        contentType: file.type,
        upsert: false // If duplicate, it will error, which we ignore
      });
      // We ignore errors here because a failure likely means the file already exists (duplicate)
      // If it's a real error (e.g. permissions), getting the public URL might still work if it existed,
      // or fail later in the process.
    };

    await Promise.all([
      uploadFileIfNotExists(personPath, personImage),
      uploadFileIfNotExists(garmentPath, garmentImage)
    ]);

    const personUrl = supabase.storage.from("tryon-uploads").getPublicUrl(personPath).data.publicUrl;
    const garmentUrl = supabase.storage.from("tryon-uploads").getPublicUrl(garmentPath).data.publicUrl;
    // 2. Insert initial pending job to track it
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

    // 3. Call Azure OpenAI
    const azureFormData = new FormData();
    const model = Deno.env.get("AZURE_OPENAI_DEPLOYMENT") ?? "gpt-image-1.5";
    azureFormData.append("model", model);
    azureFormData.append("prompt", prompt);

    // Quirk: append exactly "image" multiple times
    azureFormData.append("image[]", personImage);
    azureFormData.append("image[]", garmentImage);

    const azureUrl = Deno.env.get("AZURE_OPENAI_URL") ?? "https://code-test-resource.openai.azure.com/openai/v1/images/edits";
    const azureKey = Deno.env.get("AZURE_OPENAI_KEY");

    if (!azureKey) {
      throw new Error("Azure credentials not configured");
    }

    console.log(`Calling Azure at ${azureUrl}`);
    const azureResp = await fetch(azureUrl, {
      method: "POST",
      headers: {
        "api-key": azureKey,
      },
      body: azureFormData,
    });

    const azureData = await azureResp.json();

    if (!azureResp.ok) {
      throw new Error(azureData?.error?.message || JSON.stringify(azureData));
    }

    if (!azureData.data || azureData.data.length === 0) {
      throw new Error("No image returned from Azure.");
    }

    const item = azureData.data[0];
    let base64Image = "";

    if (item.b64_json) {
      base64Image = item.b64_json;
    } else {
      throw new Error("Azure did not return a base64 image.");
    }

    // 4. Upload result to tryon-results
    const byteCharacters = atob(base64Image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/png" });

    const resultPath = `${user.id}/${jobId}/result_${timestamp}.png`;
    const { error: resultUploadError } = await supabase.storage
      .from("tryon-results")
      .upload(resultPath, blob, { contentType: "image/png" });

    if (resultUploadError) throw new Error(`Failed to upload result: ${resultUploadError.message}`);

    const resultUrl = supabase.storage.from("tryon-results").getPublicUrl(resultPath).data.publicUrl;

    // 5. Update job status to succeeded
    await supabase.from("tryon_jobs").update({
      status: "succeeded",
      result_image_url: resultUrl
    }).eq("id", jobId);

    // 6. Return public URL and job ID to client
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
