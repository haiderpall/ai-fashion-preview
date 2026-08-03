import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";



// @ts-nocheck
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
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        // Client scoped to the requesting user — used only to verify identity
        const userClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const { data: { user }, error: userError } = await userClient.auth.getUser(token);
        if (userError || !user) {
            throw new Error(`Unauthorized: ${userError?.message ?? "no user"}`);
        }

        // Admin client — service role, bypasses RLS, required to delete the auth user
        const adminClient = createClient(supabaseUrl, serviceRoleKey);

        const userId = user.id;

        // ---- 1. Delete all storage objects owned by this user ----
        const bucketsToClean = ["avatars", "tryon-uploads", "tryon-results"];

        for (const bucket of bucketsToClean) {
            const { data: files, error: listError } = await adminClient.storage
                .from(bucket)
                .list(userId, { limit: 1000 });

            if (listError) {
                console.warn(`Could not list files in ${bucket}/${userId}:`, listError.message);
                continue;
            }

            if (files && files.length > 0) {
                // Storage.list only lists one level — recursively gather nested paths (e.g. tryon-results/{userId}/{jobId}/file.png)
                const pathsToRemove: string[] = [];

                for (const file of files) {
                    if (file.id === null) {
                        // it's a folder — list its contents too
                        const { data: nested } = await adminClient.storage
                            .from(bucket)
                            .list(`${userId}/${file.name}`, { limit: 1000 });
                        nested?.forEach((f) => pathsToRemove.push(`${userId}/${file.name}/${f.name}`));
                    } else {
                        pathsToRemove.push(`${userId}/${file.name}`);
                    }
                }

                if (pathsToRemove.length > 0) {
                    const { error: removeError } = await adminClient.storage
                        .from(bucket)
                        .remove(pathsToRemove);
                    if (removeError) {
                        console.warn(`Failed to remove some files in ${bucket}:`, removeError.message);
                    }
                }
            }
        }

        // ---- 2. Delete database rows owned by this user ----
        const { error: jobsDeleteError } = await adminClient
            .from("tryon_jobs")
            .delete()
            .eq("user_id", userId);

        if (jobsDeleteError) {
            console.warn("Failed to delete tryon_jobs rows:", jobsDeleteError.message);
        }

        // ---- 3. Delete the actual auth user (must be last) ----
        const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteUserError) {
            throw new Error(`Failed to delete user: ${deleteUserError.message}`);
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        console.error("Delete Account Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});