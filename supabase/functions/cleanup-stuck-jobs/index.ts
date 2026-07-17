// @ts-ignore: Deno URL import
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

declare const Deno: any;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req: any) => {
  try {
    // Calculate timestamp 3 minutes ago
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();

    // Find and update jobs that are stuck in 'pending' or 'processing'
    const { data, error } = await supabase
      .from("tryon_jobs")
      .update({
        status: "failed",
        error: "Stuck — exceeded max processing time",
      })
      .in("status", ["pending", "processing"])
      .lt("created_at", threeMinutesAgo)
      .select();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${data?.length || 0} stuck jobs`,
        cleaned_jobs: data?.map((j: any) => j.id),
      }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("Cleanup failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
