import { Router, Request, Response } from 'express'
import { recipesRouter } from './recipes.js'
import { ScrapeRequestSchema } from '@reel-eats/shared'
import { processJob } from './recipes.js'
import * as db from '../services/db.js'

export const router = Router()

router.use('/recipes', recipesRouter)

const TEST_USER_ID = 'c80bf05e-c022-4742-9785-33e3ee4ed5f6'

// DEV ONLY — remove before launch
router.post('/test-pipeline', async (req: Request, res: Response) => {
  const parsed = ScrapeRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues })
    return
  }
  const job = await db.createJob(TEST_USER_ID, parsed.data.url)
  void processJob(job.id, TEST_USER_ID, parsed.data.url)
  res.status(202).json({ data: { jobId: job.id } })
})

// DEV ONLY — poll job status without auth
router.get('/test-pipeline/:jobId', async (req: Request, res: Response) => {
  const job = await db.getJob(req.params.jobId, TEST_USER_ID)
  if (!job) {
    res.status(404).json({ error: 'Job not found' })
    return
  }
  res.json({ data: job })
})
