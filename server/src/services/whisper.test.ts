import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── External boundary mocks ──────────────────────────────────────────────────

const mockRun = vi.fn()
vi.mock('replicate', () => ({
  default: vi.fn().mockImplementation(() => ({ run: mockRun })),
}))

vi.mock('fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue(Buffer.from('fake-audio-data')),
}))

// ── Tests ────────────────────────────────────────────────────────────────────

describe('transcribeVideo', () => {
  beforeEach(() => {
    mockRun.mockReset()
  })

  it('returns the transcription string from Whisper output', async () => {
    mockRun.mockResolvedValue({
      transcription: 'Add two cups of flour to the bowl.',
      detected_language: 'english',
      segments: [],
    })

    const { transcribeVideo } = await import('./whisper.js')
    const result = await transcribeVideo('/tmp/reel-test.mp4')

    expect(result).toBe('Add two cups of flour to the bowl.')
  })

  it('passes the correct model and input shape to replicate.run', async () => {
    mockRun.mockResolvedValue({ transcription: 'test', detected_language: 'en', segments: [] })

    const { transcribeVideo } = await import('./whisper.js')
    await transcribeVideo('/tmp/reel-test.mp4')

    expect(mockRun).toHaveBeenCalledOnce()
    const [model, options] = mockRun.mock.calls[0] as [string, { input: Record<string, unknown> }]
    expect(model).toMatch(/openai\/whisper:/)
    expect(options.input).toMatchObject({ model: 'large-v3', language: 'en', translate: false })
    expect(options.input.audio).toBeInstanceOf(Blob)
  })

  it('returns empty string when transcription field is missing', async () => {
    mockRun.mockResolvedValue({ detected_language: 'english', segments: [] })

    const { transcribeVideo } = await import('./whisper.js')
    const result = await transcribeVideo('/tmp/reel-test.mp4')

    expect(result).toBe('')
  })

  it('throws when Replicate returns an error', async () => {
    mockRun.mockRejectedValue(new Error('Replicate API timeout'))

    const { transcribeVideo } = await import('./whisper.js')
    await expect(transcribeVideo('/tmp/reel-test.mp4')).rejects.toThrow('Replicate API timeout')
  })

  it('throws when the video file cannot be read', async () => {
    const { readFile } = await import('fs/promises')
    vi.mocked(readFile).mockRejectedValueOnce(new Error('ENOENT: no such file'))

    const { transcribeVideo } = await import('./whisper.js')
    await expect(transcribeVideo('/tmp/missing.mp4')).rejects.toThrow('ENOENT')
  })
})
