import { Router } from 'express'
import { recipesRouter } from './recipes.js'

export const router = Router()

router.use('/recipes', recipesRouter)
