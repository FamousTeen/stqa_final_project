// lib/imageHelpers.ts
import { supabaseServer } from './supabaseServer';

export async function getEventImageUrl(imagePath?: string | null, expiresSec = 60) {
  if (!imagePath) return '/placeholder-event.jpg'; // fallback local asset

  // If your bucket is public, you can build the public URL:
  // const { data } = supabaseServer.storage.from('event-images').getPublicUrl(imagePath)
  // return data?.publicUrl ?? '/placeholder-event.jpg';

  // If bucket is private and you want a signed URL (server-side):
  try {
    const { data, error } = await supabaseServer.storage
      .from('event-images')
      .createSignedUrl(imagePath, expiresSec);

    if (error || !data) {
      console.error('Signed URL error:', error);
      return '/placeholder-event.jpg';
    }
    // v2 returns data.signedURL or data.signedUrl depending on version
    // prefer data.signedUrl
    return data.signedUrl ?? data.signedUrl ?? '/placeholder-event.jpg';
  } catch (err) {
    console.error('getEventImageUrl error', err);
    return '/placeholder-event.jpg';
  }
}
