import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isNative = Capacitor.isNativePlatform();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: !isNative, // Disable URL session detection in native apps
    storage: window.localStorage,
    flowType: 'pkce', // Use PKCE flow for better security
  },
});

/**
 * Upload an image directly to Supabase Storage
 * Returns the public URL of the uploaded image
 */
export const uploadImageToSupabase = async (
  blob: Blob,
  fileName: string,
  folder: string = 'hazardImage',
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `${folder}/${timestamp}-${sanitizedFileName}`;

    console.log(`[Supabase] Uploading to: ${storagePath} (${(blob.size / 1024).toFixed(0)}KB)`);

    // ✅ PHASE 3: Milestone-based progress (no fake simulation)
    try {
      // 0% - Starting upload
      if (onProgress) onProgress(0);

      // 30% - Uploading to Supabase storage
      if (onProgress) onProgress(30);

      const uploadPromise = supabase.storage
        .from('assets')
        .upload(storagePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 60 seconds')), 60000)
      );

      const { error } = await Promise.race([uploadPromise, timeoutPromise]);

      if (error) {
        console.error('[Supabase] Upload error:', error);
        throw new Error(error.message || 'Failed to upload image');
      }

      // 70% - Upload complete, retrieving URL
      if (onProgress) onProgress(70);

      // ✅ PHASE 3: Retry logic for getPublicUrl() with exponential backoff
      let publicUrl: string | null = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          const { data: urlData } = supabase.storage
            .from('assets')
            .getPublicUrl(storagePath);

          publicUrl = urlData?.publicUrl;

          if (publicUrl) {
            console.log(`[Supabase] Got public URL on attempt ${retryCount + 1}: ${publicUrl}`);
            break; // Success, exit retry loop
          }

          throw new Error('Public URL is null');
        } catch (urlErr) {
          retryCount++;
          console.warn(`[Supabase] getPublicUrl attempt ${retryCount}/${maxRetries} failed:`, urlErr);

          if (retryCount < maxRetries) {
            // Exponential backoff: 500ms, 1000ms, 1500ms
            const delayMs = 500 * retryCount;
            console.log(`[Supabase] Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            throw new Error('Failed to get public URL after 3 attempts');
          }
        }
      }

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      // 100% - Complete
      if (onProgress) onProgress(100);

      console.log(`[Supabase] Upload successful: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      console.error('[Supabase] Upload failed:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('[Supabase] Upload failed:', error);
    throw error;
  }
};
