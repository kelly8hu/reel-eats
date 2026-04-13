import Replicate from 'replicate'
import { readFile } from 'fs/promises'
import { logger } from '../lib/logger.js'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? ''

if (!REPLICATE_API_TOKEN) {
  throw new Error('Missing required env var: REPLICATE_API_TOKEN')
}

// Pin to a specific version for reproducibility.
// Check https://replicate.com/openai/whisper for the latest version hash.
const WHISPER_MODEL =
  'openai/whisper:4d50797290df275329f202e48c76360b3f22b08d53278b9ec54a84e622c18d8'

const replicate = new Replicate({ auth: REPLICATE_API_TOKEN })

interface WhisperOutput {
  transcription: string
  detected_language: string
  segments: Array<{ text: string; start: number; end: number }>
}

/**
 * Transcribe audio from a local video file using Replicate Whisper.
 * The file at videoFilePath must exist. Caller is responsible for cleanup.
 */
export async function transcribeVideo(videoFilePath: string): Promise<string> {
  logger.debug({ videoFilePath }, 'Submitting video to Replicate Whisper')

  const audioData = await readFile(videoFilePath)
  const audioBlob = new Blob([audioData], { type: 'video/mp4' })

  const output = (await replicate.run(WHISPER_MODEL, {
    input: {
      audio: audioBlob,
      model: 'large-v3',
      language: 'en',
      translate: false,
      temperature: 0,
    },
  })) as WhisperOutput

  const transcript = output?.transcription ?? ''
  logger.debug({ chars: transcript.length }, 'Whisper transcription complete')
  return transcript
}
