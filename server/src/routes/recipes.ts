import { Router, Request, Response, NextFunction } from 'express'
import rateLimit from 'express-rate-limit'
import { ScrapeRequestSchema } from '@reel-eats/shared'
import { requireAuth } from '../middleware/requireAuth.js'
import { scrapeReel, cleanupTempFile } from '../services/scraper.js'
import { transcribeVideo } from '../services/whisper.js'
import { extractRecipe } from '../services/ai.js'
import * as db from '../services/db.js'
import { logger } from '../lib/logger.js'

export const recipesRouter = Router()

// 10 requests / user / hour (CLAUDE.md security rule)
const recipeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.user?.id ?? req.ip ?? 'unknown',
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Recipe limit reached (10/hour)' } },
})

// Wraps async route handlers so thrown errors reach the global error handler
function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next)
  }
}

// POST /api/recipes
// Validates URL, creates a job, starts pipeline in background, returns job ID immediately
recipesRouter.post(
  '/',
  requireAuth,
  recipeLimiter,
  asyncHandler(async (req, res) => {
    const parsed = ScrapeRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'INVALID_URL',
          message: 'Must be a valid Instagram Reel URL',
          details: parsed.error.issues,
        },
      })
      return
    }

    const job = await db.createJob(req.user!.id)

    // Fire-and-forget — client polls GET /jobs/:jobId for progress
    void processJob(job.id, req.user!.id, parsed.data.url)

    res.status(202).json({ data: { jobId: job.id } })
  })
)

// GET /api/recipes/jobs/:jobId — poll job status
recipesRouter.get(
  '/jobs/:jobId',
  requireAuth,
  asyncHandler(async (req, res) => {
    const job = await db.getJob(req.params.jobId, req.user!.id)
    if (!job) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } })
      return
    }
    res.json({ data: job })
  })
)

// GET /api/recipes — list saved recipes for the authenticated user
recipesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const recipes = await db.getRecipes(req.user!.id)
    res.json({ data: recipes })
  })
)

// GET /api/recipes/:id — fetch a single recipe
recipesRouter.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req, res) => {
    const recipe = await db.getRecipe(req.params.id, req.user!.id)
    if (!recipe) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recipe not found' } })
      return
    }
    res.json({ data: recipe })
  })
)

/**
 * Background pipeline: scrape → transcribe → extract → save.
 * Exported for direct testing. Called with `void` from the POST handler — never awaited.
 * Full try/catch inside so no unhandled rejections bubble up.
 */
export async function processJob(jobId: string, userId: string, url: string): Promise<void> {
  let tempPath: string | undefined

  try {
    await db.updateJob(jobId, { status: 'processing' })

    const reel = await scrapeReel(url)
    tempPath = reel.tempVideoPath

    const whisperTranscript = await transcribeVideo(tempPath)

    const recipe = await extractRecipe({
      instagramUrl: url,
      thumbnailUrl: reel.thumbnailUrl,
      caption: reel.caption,
      apifyTranscript: reel.apifyTranscript,
      whisperTranscript,
    })

    const saved = await db.saveRecipe(recipe, userId)
    await db.updateJob(jobId, { status: 'completed', recipe_id: saved.id })
    logger.info({ jobId, recipeId: saved.id }, 'Job completed')
  } catch (err) {
    logger.error({ err, jobId }, 'Job failed')
    try {
      await db.updateJob(jobId, {
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    } catch (dbErr) {
      logger.error({ dbErr, jobId }, 'Failed to mark job as failed')
    }
  } finally {
    if (tempPath) await cleanupTempFile(tempPath)
  }
}
