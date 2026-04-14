import { z } from 'zod'

export const InstagramUrlSchema = z
  .string()
  .regex(
    /^https:\/\/(www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+/,
    'Must be a valid Instagram Reel URL'
  )

export const IngredientSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  unit: z.string().optional(),
})

export const RecipeStepSchema = z.object({
  step: z.number().int().positive(),
  instruction: z.string(),
  duration_seconds: z.number().int().nonnegative().optional(),
})

export const RecipeSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string(),
  description: z.string().optional(),
  ingredients: z.array(IngredientSchema),
  steps: z.array(RecipeStepSchema),
  servings: z.number().int().positive().optional(),
  prep_time_minutes: z.number().int().nonnegative().optional(),
  cook_time_minutes: z.number().int().nonnegative().optional(),
  health_notes: z.array(z.string()).optional(),
  instagram_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  created_at: z.string().optional(),
})

export const JobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed'])

export const JobSchema = z.object({
  id: z.string().uuid(),
  status: JobStatusSchema,
  recipe_id: z.string().uuid().nullable().optional(),
  error: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const ScrapeRequestSchema = z.object({
  url: InstagramUrlSchema,
})
