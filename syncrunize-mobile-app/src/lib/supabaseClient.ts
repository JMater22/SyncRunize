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

    // Simulate progress updates (Supabase doesn't provide native progress)
    const progressInterval = setInterval(() => {
      if (onProgress) {
        // Simulate progress from 0-90% during upload
        const fakeProgress = Math.min(90, Math.random() * 90);
        onProgress(fakeProgress);
      }
    }, 200);

    const { data, error } = await supabase.storage
      .from('assets')
      .upload(storagePath, blob, {
        contentType: blob.type,
        upsert: true,
      });

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
    console.error('[Supabase] Upload failed:', error);
    throw error;
  }
};
