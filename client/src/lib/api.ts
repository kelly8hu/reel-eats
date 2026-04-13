import { supabase } from './supabase.js'

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export type ApiResponse<T> = { data: T; error?: never } | { data?: never; error: { code: string; message: string } }

export async function submitRecipe(url: string): Promise<ApiResponse<{ jobId: string }>> {
  const headers = await authHeaders()
  const res = await fetch('/api/recipes', {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  })
  return res.json() as Promise<ApiResponse<{ jobId: string }>>
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
  const res = await fetch(`/api/recipes/jobs/${jobId}`, { headers })
  return res.json() as Promise<ApiResponse<JobResult>>
}
