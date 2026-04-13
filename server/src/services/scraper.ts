import { unlink, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { logger } from '../lib/logger.js'

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN ?? ''
const ACTOR_ID = 'apify~instagram-scraper'
const APIFY_BASE = 'https://api.apify.com/v2'

if (!APIFY_API_TOKEN) {
  throw new Error('Missing required env var: APIFY_API_TOKEN')
}

export interface ScrapedReel {
  videoUrl: string
  thumbnailUrl: string | undefined
  caption: string
  apifyTranscript: string
  /** Caller must delete this file after Whisper finishes — see cleanupTempFile */
  tempVideoPath: string
}

// Raw shape returned by the Apify Instagram Scraper actor.
// Field names verified against apify~instagram-scraper v4.x output.
interface ApifyItem {
  videoUrl?: string
  url?: string
  thumbnailUrl?: string
  displayUrl?: string
  caption?: string
  text?: string
  accessibility_caption?: string
  transcript?: string
}

export async function scrapeReel(instagramUrl: string): Promise<ScrapedReel> {
  logger.debug({ instagramUrl }, 'Calling Apify Instagram scraper')

  const endpoint =
    `${APIFY_BASE}/acts/${ACTOR_ID}/run-sync-get-dataset-items` +
    `?token=${APIFY_API_TOKEN}&timeout=120`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      directUrls: [instagramUrl],
      resultsType: 'posts',
      resultsLimit: 1,
    }),
  })

  if (!res.ok) {
    throw new Error(`Apify API error: ${res.status} ${res.statusText}`)
  }

  const items = (await res.json()) as ApifyItem[]

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Apify returned no results for this URL')
  }

  const item = items[0]
  const videoUrl = item.videoUrl ?? item.url
  if (!videoUrl) {
    throw new Error('Apify result did not include a video URL')
  }

  const tempVideoPath = await downloadVideo(videoUrl)

  return {
    videoUrl,
    thumbnailUrl: item.thumbnailUrl ?? item.displayUrl,
    caption: item.caption ?? item.text ?? '',
    apifyTranscript: item.transcript ?? item.accessibility_caption ?? '',
    tempVideoPath,
  }
}

async function downloadVideo(videoUrl: string): Promise<string> {
  const tempPath = join(tmpdir(), `reel-${randomUUID()}.mp4`)
  logger.debug({ tempPath }, 'Downloading video to temp file')

  const res = await fetch(videoUrl)
  if (!res.ok) {
    throw new Error(`Failed to download video: ${res.status} ${res.statusText}`)
  }

  const buffer = await res.arrayBuffer()
  await writeFile(tempPath, Buffer.from(buffer))

  return tempPath
}

/** Delete the temp video file. Always call this after Whisper finishes (in a finally block). */
export async function cleanupTempFile(tempPath: string): Promise<void> {
  try {
    await unlink(tempPath)
    logger.debug({ tempPath }, 'Temp file deleted')
  } catch (err) {
    logger.warn({ err, tempPath }, 'Failed to delete temp file — may require manual cleanup')
  }
}
