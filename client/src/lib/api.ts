import { supabase } from './supabase.js'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export type ApiResponse<T> = { data: T; error?: never } | { data?: never; error: { code: string; message: string } }

export type SubmitRecipeResult =
  | { jobId: string; duplicate?: never }
  | { duplicate: true; recipeId: string; jobId?: never }

export async function submitRecipe(url: string): Promise<ApiResponse<SubmitRecipeResult>> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/recipes`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  })
  const body = await res.json() as { data?: { jobId: string }; error?: { code: string; message: string; recipeId?: string } }
  if (res.status === 409 && body.error?.code === 'DUPLICATE') {
    return { data: { duplicate: true, recipeId: body.error.recipeId! } }
  }
  return body as ApiResponse<SubmitRecipeResult>
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface JobResult {
  id: string
  status: JobStatus
  recipe_id?: string
  error?: string
}

export async function getJobStatus(jobId: string): Promise<ApiResponse<JobResult>> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/recipes/jobs/${jobId}`, { headers })
  return res.json() as Promise<ApiResponse<JobResult>>
}

export interface Ingredient {
  name: string
  quantity: string
  unit?: string
}

export interface RecipeStep {
  step: number
  instruction: string
  duration_seconds?: number
}

export interface Recipe {
  id: string
  title: string
  description?: string
  ingredients: Ingredient[]
  steps: RecipeStep[]
  servings?: number
  prep_time_minutes?: number
  cook_time_minutes?: number
  health_notes?: string[]
  instagram_url: string
  thumbnail_url?: string
  created_at?: string
}

export async function getRecipes(): Promise<ApiResponse<Recipe[]>> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/recipes`, { headers })
  return res.json() as Promise<ApiResponse<Recipe[]>>
}

export async function getRecipe(id: string): Promise<ApiResponse<Recipe>> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/recipes/${id}`, { headers })
  return res.json() as Promise<ApiResponse<Recipe>>
}

export async function deleteRecipe(id: string): Promise<{ error?: { message: string } }> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}/api/recipes/${id}`, { method: 'DELETE', headers })
  if (res.status === 204) return {}
  const body = await res.json() as { error?: { message: string } }
  return body
}
