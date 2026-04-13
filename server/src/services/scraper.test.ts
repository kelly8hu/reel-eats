import { describe, it, expect, vi, beforeEach } from 'vitest'
import { scrapeReel, cleanupTempFile } from './scraper.js'

// ── External boundary mocks ──────────────────────────────────────────────────

vi.stubGlobal('fetch', vi.fn())

vi.mock('fs/promises', () => ({
  unlink: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_URL = 'https://www.instagram.com/reel/abc123'

const APIFY_ITEM = {
  videoUrl: 'https://cdn.example.com/video.mp4',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  caption: 'Quick pasta recipe!',
  transcript: 'Today we are making pasta.',
}

function mockApifySuccess(item = APIFY_ITEM) {
  const fetchMock = vi.mocked(fetch)
  // First fetch: Apify API
  fetchMock.mockResolvedValueOnce({
    ok: true,
    json: vi.fn().mockResolvedValue([item]),
  } as unknown as Response)
  // Second fetch: video download
  fetchMock.mockResolvedValueOnce({
    ok: true,
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as unknown as Response)
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('scrapeReel', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockReset()
  })

  it('returns scraped data and a temp file path on success', async () => {
    mockApifySuccess()

    const result = await scrapeReel(VALID_URL)

    expect(result.videoUrl).toBe(APIFY_ITEM.videoUrl)
    expect(result.thumbnailUrl).toBe(APIFY_ITEM.thumbnailUrl)
    expect(result.caption).toBe(APIFY_ITEM.caption)
    expect(result.apifyTranscript).toBe(APIFY_ITEM.transcript)
    expect(result.tempVideoPath).toMatch(/reel-.+\.mp4$/)
  })

  it('falls back to accessibility_caption when transcript is absent', async () => {
    mockApifySuccess({
      ...APIFY_ITEM,
      transcript: undefined,
      accessibility_caption: 'Auto-generated caption',
    } as unknown as typeof APIFY_ITEM)

    const result = await scrapeReel(VALID_URL)
    expect(result.apifyTranscript).toBe('Auto-generated caption')
  })

  it('throws when Apify returns a non-200 status', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
    } as unknown as Response)

    await expect(scrapeReel(VALID_URL)).rejects.toThrow('Apify API error: 429')
  })

  it('throws when Apify returns an empty dataset', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([]),
    } as unknown as Response)

    await expect(scrapeReel(VALID_URL)).rejects.toThrow('Apify returned no results')
  })

  it('throws when the result has no video URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: vi.fn().mockResolvedValue([{ caption: 'no video here' }]),
    } as unknown as Response)

    await expect(scrapeReel(VALID_URL)).rejects.toThrow('did not include a video URL')
  })

  it('throws when the video download fails', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([APIFY_ITEM]),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        body: null,
      } as unknown as Response)

    await expect(scrapeReel(VALID_URL)).rejects.toThrow('Failed to download video')
  })
})

describe('cleanupTempFile', () => {
  it('calls unlink with the given path', async () => {
    const { unlink } = await import('fs/promises')
    await cleanupTempFile('/tmp/reel-abc.mp4')
    expect(vi.mocked(unlink)).toHaveBeenCalledWith('/tmp/reel-abc.mp4')
  })

  it('does not throw if unlink fails', async () => {
    const { unlink } = await import('fs/promises')
    vi.mocked(unlink).mockRejectedValueOnce(new Error('ENOENT'))
    await expect(cleanupTempFile('/tmp/missing.mp4')).resolves.toBeUndefined()
  })
})
