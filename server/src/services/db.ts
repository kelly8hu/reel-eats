import { JobSchema, RecipeSchema, type Job, type JobStatus, type Recipe } from '@reel-eats/shared'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'
import { logger } from '../lib/logger.js'

// Explicit column lists — never select('*') in production
const JOB_COLS = 'id, status, recipe_id, error, created_at, updated_at'
const RECIPE_COLS =
  'id, title, description, ingredients, steps, servings, prep_time_minutes, cook_time_minutes, health_notes, instagram_url, thumbnail_url, created_at'

export async function createJob(userId: string): Promise<Job> {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({ user_id: userId, status: 'pending' as JobStatus })
    .select(JOB_COLS)
    .single()

  if (error) throw new Error(`Failed to create job: ${error.message}`)
  return JobSchema.parse(data)
}

export async function updateJob(
  jobId: string,
  update: { status: JobStatus; recipe_id?: string; error?: string }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('jobs')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', jobId)

  if (error) {
    logger.error({ error, jobId }, 'Failed to update job')
    throw new Error(`Failed to update job: ${error.message}`)
  }
}

export async function getJob(jobId: string, userId: string): Promise<Job | null> {
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select(JOB_COLS)
    .eq('id', jobId)
    .eq('user_id', userId)
    .single()

  if (error?.code === 'PGRST116') return null // row not found
  if (error) throw new Error(`Failed to fetch job: ${error.message}`)
  return JobSchema.parse(data)
}

export async function saveRecipe(recipe: Recipe, userId: string): Promise<Recipe> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .insert({
      user_id: userId,
      title: recipe.title,
      description: recipe.description,
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      servings: recipe.servings,
      prep_time_minutes: recipe.prep_time_minutes,
      cook_time_minutes: recipe.cook_time_minutes,
      health_notes: recipe.health_notes,
      instagram_url: recipe.instagram_url,
      thumbnail_url: recipe.thumbnail_url,
    })
    .select(RECIPE_COLS)
    .single()

  if (error) throw new Error(`Failed to save recipe: ${error.message}`)
  return RecipeSchema.parse(data)
}

export async function getRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select(RECIPE_COLS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch recipes: ${error.message}`)
  return (data ?? []).map((r) => RecipeSchema.parse(r))
}

export async function getRecipe(recipeId: string, userId: string): Promise<Recipe | null> {
  const { data, error } = await supabaseAdmin
    .from('recipes')
    .select(RECIPE_COLS)
    .eq('id', recipeId)
    .eq('user_id', userId)
    .single()

  if (error?.code === 'PGRST116') return null // row not found
  if (error) throw new Error(`Failed to fetch recipe: ${error.message}`)
  return RecipeSchema.parse(data)
}
