import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { submitRecipe, getJobStatus } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import BottomNav from '../components/BottomNav.js'

type JobState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'processing'; jobId: string }
  | { phase: 'completed'; recipeId: string }
  | { phase: 'duplicate'; recipeId: string }
  | { phase: 'failed'; error: string }

const MOODS = ['😴 Low energy', '🤢 Stomachache', '😰 Stressed', '💪 Post-workout', '🤒 Sick', '🧘 Balanced']

export default function Home() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<JobState>({ phase: 'idle' })
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const handleSubmit = useCallback(async (urlToSubmit: string) => {
    if (!urlToSubmit.trim()) return
    setJob({ phase: 'submitting' })
    const result = await submitRecipe(urlToSubmit)
    if (result.error) {
      setJob({ phase: 'failed', error: result.error.message })
      return
    }
    if (result.data.duplicate) {
      setJob({ phase: 'duplicate', recipeId: result.data.recipeId })
      return
    }
    setJob({ phase: 'processing', jobId: result.data.jobId })
  }, [])

  useEffect(() => {
    const sharedUrl = (location.state as { sharedUrl?: string } | null)?.sharedUrl
    if (!sharedUrl) return
    setUrl(sharedUrl)
    if (session) void handleSubmit(sharedUrl)
  }, [session, location.state, handleSubmit])

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

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="processing-bar" style={{ width: 120 }}>
          <div className="processing-bar-fill" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="page">
        <div className="page-header px">
          <h1>Reel<span className="logo-dot"> Eats</span></h1>
        </div>
        <div className="px stack stack-md" style={{ paddingTop: 32 }}>
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
              Save recipes from<br />Instagram Reels.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              Sign in to start saving recipes with one tap.
            </p>
          </div>
          {url && (
            <div className="card" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
              Ready to save: <span style={{ color: 'var(--red)', fontWeight: 600, wordBreak: 'break-all' }}>{url}</span>
            </div>
          )}
          {magicLinkSent ? (
            <div className="card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📬</div>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Check your email</p>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>We sent a sign-in link to {email}</p>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void sendMagicLink() }} className="stack stack-sm">
              <input
                className="input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary btn-full">
                Send sign-in link
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header px">
        <h1>Reel<span className="logo-dot"> Eats</span></h1>
      </div>

      <div className="px stack stack-lg">
        {/* URL input */}
        <div className="stack stack-sm">
          <p className="section-label">Save a recipe</p>
          <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(url) }} className="stack stack-sm">
            <input
              className="input"
              type="url"
              placeholder="https://www.instagram.com/reel/…"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={job.phase === 'submitting' || job.phase === 'processing'}
            >
              {job.phase === 'submitting' || job.phase === 'processing' ? 'Saving…' : 'Save Recipe'}
            </button>
          </form>

          {job.phase === 'processing' && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Extracting recipe…</p>
              <div className="processing-bar"><div className="processing-bar-fill" /></div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>This takes about 30 seconds</p>
            </div>
          )}

          {job.phase === 'completed' && (
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Recipe saved!</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Tap to view</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={() => navigate(`/recipes/${job.recipeId}`)}
              >
                View →
              </button>
            </div>
          )}

          {job.phase === 'duplicate' && (
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Already saved</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>You saved this reel before</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={() => navigate(`/recipes/${job.recipeId}`)}
              >
                View →
              </button>
            </div>
          )}

          {job.phase === 'failed' && (
            <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--red)' }}>
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Something went wrong</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{job.error}</p>
            </div>
          )}
        </div>

        {/* View recipes CTA */}
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/recipes')}>
          📖 View my recipes
        </button>

        {/* Mood selector */}
        <div className="stack stack-sm">
          <p className="section-label">How are you feeling?</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Soon we'll recommend recipes based on how you feel.
          </p>
          <div className="mood-pills">
            {MOODS.map((mood) => (
              <button
                key={mood}
                className={`mood-pill${selectedMood === mood ? ' selected' : ''}`}
                onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
