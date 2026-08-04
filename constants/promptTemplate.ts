export type Gender = "Men" | "Women";

const IDENTITY_PRESERVATION_INSTRUCTIONS = `Highest Priority (Must Never Change):
- Preserve the person's identity 100%.
- Keep the face exactly the same as the original photograph.
- Do not modify facial features, facial proportions, expression, hairstyle, hairline, eyebrows, ears, eyes, nose, lips, jawline, teeth, or forehead.
- Maintain the exact same gender, age appearance, ethnicity, skin tone, body shape, body proportions, height, physique, posture, pose, hand position, and camera perspective.
- Do not beautify, stylize, or reinterpret the person.
- The final image must clearly look like the same individual in the original photograph.`;

const REFERENCE_ACCURACY_INSTRUCTIONS = ``;

const TSHIRT_PROMPT = `Edit the person's photo so they are wearing a t-shirt. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a casual fitted t-shirt with a standard crew neckline and short sleeves, extracting the exact color, pattern, and graphic/print details from the reference garment image.

${REFERENCE_ACCURACY_INSTRUCTIONS}`;

const SHALWAR_KAMEEZ_PROMPT = `Edit the person's photo so they are wearing a shalwar kameez. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a traditional Pakistani shalwar kameez — a kameez (tunic) paired with matching shalwar trousers, with an optional dupatta styled naturally over the shoulder if suggested by the reference image.

${REFERENCE_ACCURACY_INSTRUCTIONS}`;

export const PROMPT_TEMPLATES: Record<Gender, Record<string, string>> = {
        Men: {
                "Shalwar Kameez": SHALWAR_KAMEEZ_PROMPT,
                "Kurta": `Edit the person's photo so they are wearing a men's kurta. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace only the existing clothing with a traditional Pakistani men's kurta — loose, straight-cut, falling past the hips, with the same neckline style as the reference if visible.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Sherwani": `Edit the provided person's photograph by replacing their current outfit with a traditional Pakistani sherwani. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace only the existing clothing with a traditional Pakistani sherwani — long structured silhouette, tailored fit through the torso, knee-length or longer, with a formal stand (band) collar, realistic natural folds and fabric draping, and authentic tailoring.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Waistcoat": `Edit the person's photo so they are wearing a waistcoat layered over their existing or an appropriate base layer (shirt/kurta). ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace only the outer layer with a fitted, sleeveless waistcoat.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Kurta Pajama": `Edit the person's photo so they are wearing a men's kurta pajama set. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a casual-to-semi-formal kurta paired with straight-cut pajama trousers, matching the reference garment's fabric and color.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "T-shirt": TSHIRT_PROMPT,
        },

        Women: {
                "Shalwar Kameez": `Edit the person's photo so they are wearing a women's shalwar kameez. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a traditional shalwar kameez set — a kameez (tunic) paired with matching shalwar trousers, with a dupatta draped naturally over the shoulder or as suggested by the reference image.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Kurta": `Edit the person's photo so they are wearing a women's kurta. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace only the existing clothing with a women's kurta — fitted through the bust, flaring gently at the hem, falling at or below hip length, with the neckline and sleeve style matched to the reference garment.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Anarkali": `Edit the person's photo so they are wearing an Anarkali suit. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a flowing Anarkali-style outfit — fitted bodice flaring into a long, layered frock-style skirt, paired with churidar trousers, with embellishment and fabric flow matching the reference garment.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Lehenga": `Edit the person's photo so they are wearing a lehenga. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a lehenga choli — a fitted, embellished choli (blouse) paired with a voluminous, floor-length embroidered lehenga skirt, with an optional dupatta draped naturally, matching the reference garment's color, embroidery, and fabric.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "Saree": `Edit the person's photo so they are wearing a saree. ${IDENTITY_PRESERVATION_INSTRUCTIONS}

Clothing Replacement:
Replace the existing clothing with a traditional saree, elegantly draped with pleats falling naturally and the pallu styled over one shoulder, paired with a fitted blouse matching the reference garment's fabric, color, and embroidery.

${REFERENCE_ACCURACY_INSTRUCTIONS}`,

                "T-shirt": TSHIRT_PROMPT,
        },
};

export function getGarmentsForGender(gender: Gender | null): string[] {
        if (!gender) return [];
        return Object.keys(PROMPT_TEMPLATES[gender]);
}

export function getPromptForGarment(gender: Gender | null, garment: string): string | undefined {
        if (!gender) return undefined;
        return PROMPT_TEMPLATES[gender]?.[garment];
}