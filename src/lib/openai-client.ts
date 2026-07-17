import { supabase } from './supabase';

export async function analyzeImages(
    images: {
        uri: string;
        name: string;
        type: string;
    }[],
    prompt: string,
    garmentCategory: string = "general",
    customerName?: string,
    customerEmail?: string
) {
    const formData = new FormData();

    formData.append("prompt", prompt);
    formData.append("category", garmentCategory);

    if (customerName) {
        formData.append("customerName", customerName);
    }
    if (customerEmail) {
        formData.append("customerEmail", customerEmail);
    }

    images.forEach((image) => {
        formData.append(
            "image",
            {
                uri: image.uri,
                name: image.name,
                type: image.type,
            } as any
        );
    });

    console.log("========== Edge Function Request ==========");
    console.log("Prompt:", prompt);
    console.log("Category:", garmentCategory);
    console.log("Images:", images);

    try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            throw new Error("User must be logged in to generate images.");
        }

        const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zjysguhqedbtaoybutag.supabase.co'}/functions/v1/generate-tryon`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData,
        });

        console.log("Edge Function Status:", response.status);

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to process image generation.");
        }

        console.log("Edge Function Response:", data);

        return {
            imageUri: data.url,
            jobId: data.id,
        };
    } catch (error) {
        console.error("Edge Function Error:", error);
        throw error;
    }
}