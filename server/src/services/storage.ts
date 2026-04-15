import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { logger } from '../lib/logger.js'

const BUCKET = 'recipe-thumbnails'

/**
 * Downloads a thumbnail from Instagram CDN server-side and uploads it to Supabase Storage.
 * Returns the permanent public URL, or undefined if the upload fails (caller uses original URL as fallback).
 */
export async function uploadThumbnail(
  thumbnailUrl: string,
  userId: string,
  jobId: string
): Promise<string | undefined> {
  try {
    const response = await fetch(thumbnailUrl, {
      headers: {
        // Mimic a browser request so Instagram CDN doesn't block it
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) throw new Error(`Thumbnail fetch failed: HTTP ${response.status}`)

    const buffer = Buffer.from(await response.arrayBuffer())
    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const ext = contentType.includes('png') ? 'png' : 'jpg'
    const path = `${userId}/${jobId}.${ext}`

    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: true })

    if (error) throw new Error(`Storage upload failed: ${error.message}`)

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    logger.debug({ path }, 'Thumbnail uploaded to Supabase Storage')
    return data.publicUrl
  } catch (err) {
    logger.warn({ err, thumbnailUrl }, 'Thumbnail upload failed — will use original URL')
    return undefined
  }
}
