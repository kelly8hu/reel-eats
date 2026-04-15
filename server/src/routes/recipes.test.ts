import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'

// ── Mocks (hoisted before imports) ───────────────────────────────────────────

// Bypass rate limiting entirely in tests
vi.mock('express-rate-limit', () => ({
  default: vi.fn(() => (_req: unknown, _res: unknown, next: () => void) => next()),
}))

// Auth middleware — sets req.user without hitting Supabase
vi.mock('../middleware/requireAuth.js', () => ({
  requireAuth: vi.fn((req: { user: unknown }, _res: unknown, next: () => void) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' }
    next()
  }),
}))

vi.mock('../services/db.js', () => ({
  createJob: vi.fn(),
  updateJob: vi.fn().mockResolvedValue(undefined),
  getJob: vi.fn(),
  saveRecipe: vi.fn(),
  getRecipes: vi.fn(),
  getRecipe: vi.fn(),
  findRecipeByUrl: vi.fn().mockResolvedValue(null),
  deleteRecipe: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/scraper.js', () => ({
  scrapeReel: vi.fn(),
  cleanupTempFile: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../services/whisper.js', () => ({
  transcribeVideo: vi.fn(),
}))

vi.mock('../services/ai.js', () => ({
  extractRecipe: vi.fn(),
}))

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { app } from '../app.js'
import * as db from '../services/db.js'
import * as scraper from '../services/scraper.js'
import * as whisper from '../services/whisper.js'
import * as ai from '../services/ai.js'
import { processJob } from './recipes.js'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString()
const VALID_URL = 'https://www.instagram.com/reel/abc123'

const mockJob = {
  id: 'job-uuid-1',
  status: 'pending' as const,
  recipe_id: undefined,
  error: undefined,
  created_at: NOW,
  updated_at: NOW,
}

const mockRecipe = {
  id: 'recipe-uuid-1',
  title: 'Test Pasta',
  description: 'A test recipe.',
  ingredients: [{ name: 'flour', quantity: '2 cups' }],
  steps: [{ step: 1, instruction: 'Mix.' }],
  servings: 2,
  instagram_url: VALID_URL,
  thumbnail_url: 'https://cdn.example.com/thumb.jpg',
  created_at: NOW,
}

// ── Route tests ───────────────────────────────────────────────────────────────

describe('POST /api/recipes', () => {
  beforeEach(() => {
    vi.mocked(db.createJob).mockResolvedValue(mockJob)
  })

  it('returns 202 with a jobId for a valid Instagram URL', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ url: VALID_URL })

    expect(res.status).toBe(202)
    expect(res.body.data.jobId).toBe('job-uuid-1')
  })

  it('returns 400 for an invalid URL', async () => {
    const res = await request(app)
      .post('/api/recipes')
      .send({ url: 'https://tiktok.com/video/123' })

    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_URL')
  })

  it('returns 400 when body is missing url', async () => {
    const res = await request(app).post('/api/recipes').send({})
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_URL')
  })

  it('calls db.createJob with the authenticated user id', async () => {
    await request(app).post('/api/recipes').send({ url: VALID_URL })
    expect(vi.mocked(db.createJob)).toHaveBeenCalledWith('test-user-id', VALID_URL)
  })
})

describe('GET /api/recipes/jobs/:jobId', () => {
  it('returns the job when found', async () => {
    vi.mocked(db.getJob).mockResolvedValue({ ...mockJob, status: 'completed' })

    const res = await request(app).get('/api/recipes/jobs/job-uuid-1')

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe('job-uuid-1')
    expect(res.body.data.status).toBe('completed')
  })

  it('returns 404 when job not found', async () => {
    vi.mocked(db.getJob).mockResolvedValue(null)

    const res = await request(app).get('/api/recipes/jobs/missing-id')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('scopes the lookup to the authenticated user', async () => {
    vi.mocked(db.getJob).mockResolvedValue(mockJob)

    await request(app).get('/api/recipes/jobs/job-uuid-1')

    expect(vi.mocked(db.getJob)).toHaveBeenCalledWith('job-uuid-1', 'test-user-id')
  })
})

describe('GET /api/recipes', () => {
  it('returns the user\'s recipe list', async () => {
    vi.mocked(db.getRecipes).mockResolvedValue([mockRecipe])

    const res = await request(app).get('/api/recipes')

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].title).toBe('Test Pasta')
  })

  it('returns empty array when no recipes exist', async () => {
    vi.mocked(db.getRecipes).mockResolvedValue([])

    const res = await request(app).get('/api/recipes')

    expect(res.status).toBe(200)
    expect(res.body.data).toEqual([])
  })
})

describe('GET /api/recipes/:id', () => {
  it('returns the recipe when found', async () => {
    vi.mocked(db.getRecipe).mockResolvedValue(mockRecipe)

    const res = await request(app).get('/api/recipes/recipe-uuid-1')

    expect(res.status).toBe(200)
    expect(res.body.data.id).toBe('recipe-uuid-1')
  })

  it('returns 404 when recipe not found', async () => {
    vi.mocked(db.getRecipe).mockResolvedValue(null)

    const res = await request(app).get('/api/recipes/missing-id')

    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('scopes the lookup to the authenticated user', async () => {
    vi.mocked(db.getRecipe).mockResolvedValue(mockRecipe)

    await request(app).get('/api/recipes/recipe-uuid-1')

    expect(vi.mocked(db.getRecipe)).toHaveBeenCalledWith('recipe-uuid-1', 'test-user-id')
  })
})

// ── processJob pipeline tests ────────────────────────────────────────────────

describe('processJob', () => {
  const REEL = {
    videoUrl: 'https://cdn.example.com/video.mp4',
    thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
    caption: 'Great pasta recipe!',
    apifyTranscript: 'Making pasta today.',
    tempVideoPath: '/tmp/reel-test.mp4',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.updateJob).mockResolvedValue(undefined)
    vi.mocked(scraper.scrapeReel).mockResolvedValue(REEL)
    vi.mocked(scraper.cleanupTempFile).mockResolvedValue(undefined)
    vi.mocked(whisper.transcribeVideo).mockResolvedValue('Whisper transcript here.')
    vi.mocked(ai.extractRecipe).mockResolvedValue(mockRecipe)
    vi.mocked(db.saveRecipe).mockResolvedValue({ ...mockRecipe, id: 'saved-recipe-id' })
  })

  it('runs the full pipeline and marks job completed', async () => {
    await processJob('job-id', 'user-id', VALID_URL)

    expect(vi.mocked(db.updateJob)).toHaveBeenCalledWith('job-id', { status: 'processing' })
    expect(vi.mocked(scraper.scrapeReel)).toHaveBeenCalledWith(VALID_URL)
    expect(vi.mocked(whisper.transcribeVideo)).toHaveBeenCalledWith(REEL.tempVideoPath)
    expect(vi.mocked(ai.extractRecipe)).toHaveBeenCalledWith(
      expect.objectContaining({
        instagramUrl: VALID_URL,
        caption: REEL.caption,
        apifyTranscript: REEL.apifyTranscript,
        whisperTranscript: 'Whisper transcript here.',
      })
    )
    expect(vi.mocked(db.updateJob)).toHaveBeenLastCalledWith('job-id', {
      status: 'completed',
      recipe_id: 'saved-recipe-id',
    })
  })

  it('marks job as failed and does not throw when scraper errors', async () => {
    vi.mocked(scraper.scrapeReel).mockRejectedValue(new Error('Apify timeout'))

    await expect(processJob('job-id', 'user-id', VALID_URL)).resolves.toBeUndefined()

    expect(vi.mocked(db.updateJob)).toHaveBeenCalledWith('job-id', {
      status: 'failed',
      error: 'Apify timeout',
    })
  })

  it('always cleans up the temp file, even on failure', async () => {
    vi.mocked(whisper.transcribeVideo).mockRejectedValue(new Error('Replicate error'))

    await processJob('job-id', 'user-id', VALID_URL)

    expect(vi.mocked(scraper.cleanupTempFile)).toHaveBeenCalledWith(REEL.tempVideoPath)
  })

  it('does not attempt cleanup when scraper fails before download', async () => {
    vi.mocked(scraper.scrapeReel).mockRejectedValue(new Error('No results'))

    await processJob('job-id', 'user-id', VALID_URL)

    expect(vi.mocked(scraper.cleanupTempFile)).not.toHaveBeenCalled()
  })
})
