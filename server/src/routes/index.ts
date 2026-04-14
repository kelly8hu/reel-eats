import { Router, Request, Response } from 'express'
import { recipesRouter } from './recipes.js'
import { ScrapeRequestSchema } from '@reel-eats/shared'
import { processJob } from './recipes.js'
import * as db from '../services/db.js'

export const router = Router()

router.use('/recipes', recipesRouter)

// DEV ONLY — remove before launch
// Test the pipeline without auth: POST /api/test-pipeline { "url": "..." }
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-pipeline', async (req: Request, res: Response) => {
    const parsed = ScrapeRequestSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues })
      return
    }
    const TEST_USER_ID = '00000000-0000-0000-0000-000000000001'
    const job = await db.createJob(TEST_USER_ID, parsed.data.url)
    void processJob(job.id, TEST_USER_ID, parsed.data.url)
    res.status(202).json({ data: { jobId: job.id } })
  })
}
