# AI Fashion Preview - Architecture & Project Structure

## 1. Folder Structure Overview

- `app/`
  Contains all the Expo Router screens and layout files. It handles the application navigation, with authentication screens at the root and the main authenticated dashboard inside the `(tabs)` folder.
- `src/`
  Houses all shared application code. This includes custom reusable UI components (`src/components/`), the centralized theme and design system (`src/theme/`), and core logic like authentication and API wrappers (`src/lib/`).
- `supabase/`
  Contains the backend infrastructure definition. This includes Deno Edge Functions in `supabase/functions/` (for secure server-side logic like generating images and deleting accounts) and SQL migrations in `supabase/migrations/` (defining the schema and Row Level Security policies).
- `assets/`
  Stores static images such as app icons, splash screens, and placeholder graphics used throughout the app.
- `constants/`
  Contains configuration data, specifically `promptTemplate.ts`, which holds the definitions for garment categories, genders, and the corresponding text prompts sent to the AI model.
- `scripts/`
  Contains utility scripts for project management, such as `reset-project.js` which was likely used to clean up the initial Expo template.

## 2. Screen-by-Screen Map

### Auth Flow
- `app/index.tsx`
  - **What it is:** Root entry point.
  - **Navigation:** Simply redirects all traffic to `/splash`.
- `app/splash.tsx`
  - **What it is:** Initialization and routing gatekeeper.
  - **Navigation:** Checks `AsyncStorage` for first-launch status. If authenticated, replaces to `/(tabs)`. If not authenticated, replaces to `/login`. If first launch, it replaces to `/signup`.
  - **State/Backend:** Uses `AsyncStorage` for the `hasLaunched` flag and `useAuth()` to check session.
- `app/signup.tsx`
  - **What it is:** Account registration screen.
  - **Navigation:** On success, replaces to `/(tabs)`. Provides a link to push to `/login`.
  - **State/Backend:** Collects shop name, owner name, email, and password. Uses `supabase.auth.signUp()`, passing the names in `options.data`.
- `app/login.tsx`
  - **What it is:** Standard email/password login screen.
  - **Navigation:** On success, replaces to `/(tabs)`. Provides links to push to `/signup` or `/forgot-password`.
  - **State/Backend:** Uses `supabase.auth.signInWithPassword()`.
- `app/forgot-password.tsx`
  - **What it is:** Triggers a password reset OTP.
  - **Navigation:** On success, replaces to `/verify-code` passing the email as a parameter.
  - **State/Backend:** Uses `supabase.auth.signInWithOtp()`.
- `app/verify-code.tsx`
  - **What it is:** Verifies the OTP sent to the user's email.
  - **Navigation:** On success, replaces to `/reset-password`.
  - **State/Backend:** Uses `supabase.auth.verifyOtp()` with type `email`.
- `app/reset-password.tsx`
  - **What it is:** Updates the user's password after OTP verification.
  - **Navigation:** On success, replaces to `/login`.
  - **State/Backend:** Uses `supabase.auth.updateUser()` to set the new password.

### Main App (`app/(tabs)`)
- `app/(tabs)/_layout.tsx`
  - **What it is:** The bottom tab navigator wrapper.
  - **Navigation:** Enforces authentication. If `user` is null, it forces a redirect to `/login`. Defines tabs for Home, History, Profile, and Settings.
- `app/(tabs)/index.tsx`
  - **What it is:** The main Home dashboard where users initiate a try-on generation.
  - **Navigation:** On clicking Generate, pushes to `/ai-processing` with image URIs, gender, category, and customer info as route parameters.
  - **State/Backend:** Uses `expo-image-picker` to get photos and `expo-image-manipulator` to aggressively compress images (down to 1024px width, 0.5 JPEG compression) before generation. 
- `app/(tabs)/history.tsx`
  - **What it is:** Lists past generated previews.
  - **Navigation:** Tapping an item pushes to `/preview-result` with `viewOnly=true`.
  - **State/Backend:** Queries the `tryon_jobs` table for rows where `status = 'succeeded'`, ordered by `created_at` descending.
- `app/(tabs)/profile.tsx`
  - **What it is:** User profile and avatar management.
  - **Navigation:** Tapping Logout triggers a sign out and replaces to `/login`.
  - **State/Backend:** Reads `user_metadata` for name/shopname. Avatar uploads use `expo-image-picker`, convert the image to base64, and upload to the `avatars` Supabase bucket, followed by `supabase.auth.updateUser()` to save the URL.
- `app/(tabs)/settings.tsx`
  - **What it is:** App preferences and account management.
  - **Navigation:** Provides pushes to `/terms` and `/help`.
  - **State/Backend:** Toggles dark mode via `useTheme()`. Handles account deletion by calling the `delete-account` Edge Function securely using the user's session token.

### Standalone / Modals
- `app/ai-processing.tsx`
  - **What it is:** A loading screen with a simulated progress ring that masks the API wait time.
  - **Navigation:** On success, replaces to `/preview-result` with the new image URL and job ID.
  - **State/Backend:** Calls `analyzeImages` from `src/lib/openai-client.ts` which triggers the `generate-tryon` Edge Function.
- `app/preview-result.tsx`
  - **What it is:** Displays the generated AI image.
  - **Navigation:** "Accept & Save" replaces to `/(tabs)/history`. "Reject & Regenerate" returns to `/(tabs)`.
  - **State/Backend:** "Reject" deletes the corresponding row from the `tryon_jobs` table. "Download" uses `expo-file-system` and `expo-media-library` to save the image to the device gallery.
- `app/help.tsx`
  - **What it is:** Static FAQ screen.
- `app/terms.tsx`
  - **What it is:** Static Terms of Service screen.

## 3. Shared Code Map

### Components (`src/components/`)
- `Button.tsx`: A highly customizable button component supporting primary/secondary variants, loading states, icons, and disabled states. Uses Animated API for scale feedback.
- `Card.tsx`: A foundational wrapper component providing a standard background, rounded corners, and padding to match the design system.
- `Input.tsx`: A styled text input field supporting labels, placeholder text, prefix icons, and error states.
- `ThemeToggle.tsx`: A simple button (using Lucide icons) to manually toggle between light and dark themes.

### Library / Integrations (`src/lib/`)
- `auth-context.tsx`: Provides a React Context (`useAuth`) that wraps `supabase.auth`. It holds the `user` and `session` objects, tracks auth state changes via `onAuthStateChange`, and exposes helper methods like `signIn`, `signUp`, and `signOut`.
- `supabase.ts`: Initializes the Supabase client (`createClient`). Crucially, it provides a custom `ExpoSecureStoreAdapter` so that the user's session is securely persisted on the device using `expo-secure-store`.
- `openai-client.ts`: Contains `analyzeImages()`. Despite the file name, it doesn't call OpenAI directly; it constructs a `FormData` object containing the compressed images and prompt, and sends it to the `generate-tryon` Supabase Edge Function using `supabase.functions.invoke()`.

### Theme & Constants
- `src/theme/ThemeContext.tsx`: Manages the `isDark` state and provides the active `colors` object to the rest of the app.
- `src/theme/colors.ts`: Defines the strict `lightColors` and `darkColors` palettes (primary, surface, outline, etc.).
- `src/theme/spacing.ts`: Defines standard spacing (xs, sm, md, lg, xl) and border radii (rounded.sm, rounded.md, etc.).
- `src/theme/typography.ts`: Defines standard font families (Outfit/Inter), sizes, line heights, and weights for headings and body text.
- `constants/promptTemplate.ts`: Stores the AI prompt configurations. It maps Genders to specific Garment Categories and constructs the final text prompt sent to the image generator.

## 4. Backend Map (Supabase)

### Edge Functions
- **`generate-tryon`**
  - **Inputs:** A `FormData` object containing a text `prompt`, `category`, `customerName`, `customerEmail`, and two image files (`image[0]` for person, `image[1]` for garment).
  - **Process:** 
    1. Hashes and uploads the two input images to the `tryon-uploads` bucket.
    2. Inserts a pending record into `tryon_jobs`.
    3. Converts both images to base64.
    4. Calls **Azure AI Foundry (FLUX.2-pro endpoint)** via REST API (`AZURE_OPENAI_URL` with a Bearer token).
    5. Downloads/extracts the result image.
    6. Uploads the final image to the `tryon-results` bucket.
    7. Updates the `tryon_jobs` record to `succeeded` with the final image URL.
  - **Returns:** `{ url: string, id: string }`

- **`delete-account`**
  - **Inputs:** A Bearer token in the Authorization header.
  - **Process:**
    1. Verifies the user using the standard client.
    2. Uses the `SUPABASE_SERVICE_ROLE_KEY` to recursively delete all files owned by the user in `avatars`, `tryon-uploads`, and `tryon-results` buckets.
    3. Deletes all rows in `tryon_jobs` for that user.
    4. Calls `adminClient.auth.admin.deleteUser(userId)` to completely remove the user account from Auth.

### Tables
- **`tryon_jobs`**
  - Stores the metadata and status of generation attempts.
  - Columns: `id` (UUID), `user_id` (Auth ref), `status` (pending/processing/succeeded/failed), `person_image_url`, `garment_image_url`, `result_image_url`, `garment_category`, `customer_name`, `customer_email`, `created_at`.
  - **RLS:** Secured so users can only `select`, `insert`, and `update` rows where `user_id = auth.uid()`.

### Storage Buckets
- **`avatars`**: Stores user profile pictures.
- **`tryon-uploads`**: Stores the heavily compressed input photos (the customer and the garment) before sending them to the AI.
- **`tryon-results`**: Stores the high-fidelity output images generated by FLUX.2-pro.
- **RLS Note**: The `tryon-uploads` and `tryon-results` buckets enforce RLS via the `(storage.foldername(name))[1] = auth.uid()::text` pattern, meaning users can only access folders named with their own UUID.

## 5. Known Constraints & Rough Edges

1. **AsyncStorage vs. SecureStore for Auth/Launch state:** 
   Auth sessions are securely persisted via `expo-secure-store` (in `supabase.ts`), but the first-launch flag `hasLaunched` is stored in `AsyncStorage` (in `splash.tsx`). While functional, mixing storage mechanisms could lead to edge cases if a user clears app data partially or if SecureStore outlives AsyncStorage during a backup/restore cycle.
2. **Misleading Filenames:** 
   `src/lib/openai-client.ts` actually calls a Supabase Edge Function, which in turn calls Azure AI Foundry (FLUX.2-pro), not standard OpenAI endpoints. This is a naming artifact that could confuse future developers.
3. **Image Download Permissions:** 
   In `preview-result.tsx`, downloading the image requests `MediaLibrary.requestPermissionsAsync()`. If the user denies this on modern Android versions, it can fail silently or get permanently blocked without clear instructions on how to enable it in OS settings.
4. **No Retry Logic on Edge Function Timeouts:** 
   The `ai-processing.tsx` screen runs a simulated progress bar for 18 seconds, assuming the Edge Function will return. If Azure is slow or the Edge Function times out, it just crashes out to a generic error state without automatic retries.
5. **No Built-In Image Cropping:** 
   Users upload raw images which are compressed aggressively to 1024px. However, if a user uploads a very tall or wide image, there is no UI to crop it to the expected aspect ratio before sending it to the AI, which could result in weird generations if the subject is off-center.
6. **Hardcoded Bucket Structure in Delete Account:**
   The `delete-account` Edge function assumes files are nested exactly one folder deep (`userId/filename` or `userId/jobId/filename`). If the app ever stores files deeper, the deletion script will miss them and leave orphaned files.
