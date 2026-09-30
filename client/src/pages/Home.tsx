import { useState, useEffect, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { submitRecipe, getJobStatus, getRecipes, type Recipe } from '../lib/api.js'
import { supabase } from '../lib/supabase.js'
import { MOODS, recommend, type MoodId } from '../lib/moods.js'
import BottomNav from '../components/BottomNav.js'
import RecipeCard from '../components/RecipeCard.js'

type JobState =
  | { phase: 'idle' }
  | { phase: 'submitting' }
  | { phase: 'queued' }
  | { phase: 'processing'; jobId: string }
  | { phase: 'completed'; recipeId: string }
  | { phase: 'duplicate'; recipeId: string }
  | { phase: 'failed'; error: string }

export default function Home() {
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [job, setJob] = useState<JobState>({ phase: 'idle' })
  const [email, setEmail] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [selectedMoods, setSelectedMoods] = useState<MoodId[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])

  // The cookbook backs the mood recommendations; refetch when a new recipe lands
  const completedRecipeId = job.phase === 'completed' ? job.recipeId : null
  useEffect(() => {
    if (!session) return
    getRecipes().then((res) => {
      if (res.data) setRecipes(res.data)
    })
  }, [session, completedRecipeId])

  function toggleMood(id: MoodId) {
    setSelectedMoods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]))
  }

  const recommendations = recommend(recipes, selectedMoods)

  const handleSubmit = useCallback(async (urlToSubmit: string, fromShare = false) => {
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
    // When coming from the share sheet, just confirm queued — no need to wait
    if (fromShare) {
      setJob({ phase: 'queued' })
      return
    }
    setJob({ phase: 'processing', jobId: result.data.jobId })
  }, [])

  useEffect(() => {
    const sharedUrl = (location.state as { sharedUrl?: string } | null)?.sharedUrl
    if (!sharedUrl) return
    setUrl(sharedUrl)
    if (session) void handleSubmit(sharedUrl, true)
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

  // Redirects to Google; Supabase handles the callback and the session lands in localStorage
  async function signInWithGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
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
            <div className="stack stack-md">
              <button className="btn btn-primary btn-full" onClick={() => void signInWithGoogle()}>
                Continue with Google
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                or use an email link
              </p>
              <form onSubmit={(e) => { e.preventDefault(); void sendMagicLink() }} className="stack stack-sm">
                <input
                  className="input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-secondary btn-full">
                  Send sign-in link
                </button>
              </form>
            </div>
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

          {job.phase === 'queued' && (
            <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14 }}>Recipe queued!</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Ready in ~30 sec. You can close this.</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ padding: '8px 16px', fontSize: 13 }}
                onClick={() => navigate('/recipes')}
              >
                Recipes →
              </button>
            </div>
          )}

          {job.phase === 'processing' && (
            <div className="card" style={{ padding: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Extracting recipe…</p>
              <div className="processing-bar"><div className="processing-bar-fill" /></div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Usually under a minute</p>
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
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>We couldn't read that Reel</p>
              {/* Raw pipeline errors stay in server logs — the user only sees a friendly line */}
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Try another one, or check the link is a public Instagram Reel.</p>
            </div>
          )}
        </div>

        {/* View recipes CTA */}
        <button className="btn btn-secondary btn-full" onClick={() => navigate('/recipes')}>
          📖 View my recipes
        </button>

        {/* Mood selector → recommendations from the user's own cookbook */}
        <div className="stack stack-sm">
          <p className="section-label">How are you feeling?</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>
            Pick one or more and we'll suggest something from your cookbook.
          </p>
          <div className="mood-pills">
            {MOODS.map((mood) => (
              <button
                key={mood.id}
                className={`mood-pill${selectedMoods.includes(mood.id) ? ' selected' : ''}`}
                onClick={() => toggleMood(mood.id)}
              >
                {mood.emoji} {mood.label}
              </button>
            ))}
          </div>

          {selectedMoods.length > 0 && (
            <div className="stack stack-sm" style={{ marginTop: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>Recommended for you</p>
              {recommendations.length === 0 ? (
                <div className="card" style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-muted)' }}>
                  Nothing in your cookbook fits this yet — save a few more reels and check back.
                </div>
              ) : (
                <div className="recipe-grid">
                  {recommendations.map(({ recipe, reasons }) => (
                    <RecipeCard key={recipe.id} recipe={recipe} reason={reasons.join(' · ')} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
