import { z } from 'zod'
import {
  IngredientSchema,
  InstagramUrlSchema,
  JobSchema,
  JobStatusSchema,
  RecipeSchema,
  RecipeStepSchema,
  ScrapeRequestSchema,
} from './schemas.js'

export type Ingredient = z.infer<typeof IngredientSchema>
export type InstagramUrl = z.infer<typeof InstagramUrlSchema>
export type Job = z.infer<typeof JobSchema>
export type JobStatus = z.infer<typeof JobStatusSchema>
export type Recipe = z.infer<typeof RecipeSchema>
export type RecipeStep = z.infer<typeof RecipeStepSchema>
export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>
