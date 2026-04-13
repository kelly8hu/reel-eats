import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { submitRecipe, getJobStatus } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'

type JobState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'processing'; jobId: string }
  | { phase: 'completed'; recipeId: string }
  | { phase: 'failed'; error: string }

export default function Home() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<JobState>({ phase: 'idle' })
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const handleSubmit = useCallback(async (urlToSubmit: string) => {
    if (!urlToSubmit.trim()) return
    setJob({ phase: 'submitting' })

    const result = await submitRecipe(urlToSubmit)
    if (result.error) {
      setJob({ phase: 'failed', error: result.error.message })
      return
    }
    setJob({ phase: 'processing', jobId: result.data.jobId })
  }, [])

  // Pre-fill or auto-submit the URL received from the share sheet
  useEffect(() => {
    const sharedUrl = (location.state as { sharedUrl?: string } | null)?.sharedUrl
    if (!sharedUrl) return
    setUrl(sharedUrl)
    if (session) void handleSubmit(sharedUrl)
  }, [session, location.state, handleSubmit])

  // Poll while processing
  const jobId = job.phase === 'processing' ? job.jobId : null
  useEffect(() => {
    if (!jobId) return

    const id = setInterval(async () => {
      const result = await getJobStatus(jobId)
      if (!result.data) return
      if (result.data.status === 'completed' && result.data.recipe_id) {
        setJob({ phase: 'completed', recipeId: result.data.recipe_id })
      } else if (result.data.status === 'failed') {
        setJob({ phase: 'failed', error: result.data.error ?? 'Processing failed' })
      }
    }, 2000)

    return () => clearInterval(id)
  }, [jobId])

  async function sendMagicLink() {
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    setMagicLinkSent(true)
  }

  if (loading) return <p>Loading…</p>

  if (!session) {
    return (
      <main>
        <h1>Reel Eats</h1>
        {url && <p>Ready to save: <code>{url}</code></p>}
        {magicLinkSent ? (
          <p>Check your email for a sign-in link.</p>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); void sendMagicLink() }}>
            <p>Sign in to save recipes from Instagram Reels.</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit">Send sign-in link</button>
          </form>
        )}
      </main>
    )
  }

  return (
    <main>
      <h1>Reel Eats</h1>
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(url) }}>
        <input
          type="url"
          placeholder="https://www.instagram.com/reel/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={job.phase === 'submitting' || job.phase === 'processing'}
        >
          {job.phase === 'submitting' || job.phase === 'processing'
            ? 'Saving…'
            : 'Save Recipe'}
        </button>
      </form>

      {job.phase === 'processing' && <p>Extracting recipe — this takes about 30 seconds…</p>}
      {job.phase === 'completed' && <p>Recipe saved! (id: {job.recipeId})</p>}
      {job.phase === 'failed' && <p>Failed: {job.error}</p>}
    </main>
  )
}
