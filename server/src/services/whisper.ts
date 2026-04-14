import Replicate from 'replicate'
import { readFile } from 'fs/promises'
import { logger } from '../lib/logger.js'

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN ?? ''

if (!REPLICATE_API_TOKEN) {
  throw new Error('Missing required env var: REPLICATE_API_TOKEN')
}

const WHISPER_MODEL = 'openai/whisper'

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
