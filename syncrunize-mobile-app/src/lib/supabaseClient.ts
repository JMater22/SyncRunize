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

    // ✅ FIX: Simulate progress updates with incremental increase (not random)
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      if (onProgress && currentProgress < 90) {
        // Increment progress gradually: +3-8% each tick
        currentProgress += Math.random() * 5 + 3;
        currentProgress = Math.min(90, currentProgress); // Cap at 90%
        onProgress(Math.round(currentProgress));
      }
    }, 300);

    try {
      // ✅ FIX: Add 30-second timeout to prevent infinite hanging
      const uploadPromise = supabase.storage
        .from('assets')
        .upload(storagePath, blob, {
          contentType: blob.type,
          upsert: true,
        });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
      );

      const { error } = await Promise.race([uploadPromise, timeoutPromise]);

      clearInterval(progressInterval);

      if (error) {
        console.error('[Supabase] Upload error:', error);
        throw new Error(error.message || 'Failed to upload image');
      }

      if (onProgress) onProgress(100);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('assets')
        .getPublicUrl(storagePath);

      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log(`[Supabase] Upload successful: ${publicUrl}`);
      return publicUrl;
    } catch (error: any) {
      clearInterval(progressInterval); // ✅ FIX: Always clear interval on error
      console.error('[Supabase] Upload failed:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('[Supabase] Upload failed:', error);
    throw error;
  }
};
