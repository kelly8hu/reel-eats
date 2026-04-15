import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRecipe, deleteRecipe, type Recipe } from '../lib/api.js'
import BottomNav from '../components/BottomNav.js'

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [thumbError, setThumbError] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    await deleteRecipe(id)
    navigate('/recipes')
  }

  useEffect(() => {
    if (!id) return
    getRecipe(id).then((res) => {
      if (res.data) setRecipe(res.data)
      setLoading(false)
    })
  }, [id])

  function formatTime(mins?: number) {
    if (!mins) return null
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
  }

  if (loading) {
    return (
      <div className="page">
        <div className="px" style={{ paddingTop: 60 }}>
          <div className="processing-bar"><div className="processing-bar-fill" /></div>
        </div>
      </div>
    )
  }

  if (!recipe) {
    return (
      <div className="page">
        <div className="empty-state" style={{ paddingTop: 80 }}>
          <div className="empty-icon">😕</div>
          <p>Recipe not found.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/recipes')}>
            Back to recipes
          </button>
        </div>
        <BottomNav />
      </div>
    )
  }

  const prepTime = formatTime(recipe.prep_time_minutes)
  const cookTime = formatTime(recipe.cook_time_minutes)

  return (
    <div className="page">
      {/* Hero image */}
      {recipe.thumbnail_url && !thumbError ? (
        <img
          src={recipe.thumbnail_url}
          alt={recipe.title}
          className="recipe-hero"
          onError={() => setThumbError(true)}
        />
      ) : (
        <div className="recipe-hero-placeholder">🍽️</div>
      )}

      {/* Back button */}
      <div className="px" style={{ paddingTop: 16, paddingBottom: 4 }}>
        <button className="back-btn" onClick={() => navigate('/recipes')}>
          ← Back
        </button>
      </div>

      <div className="px stack stack-lg" style={{ paddingTop: 12 }}>
        {/* Title + meta */}
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
            {recipe.title}
          </h1>
          {recipe.description && (
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              {recipe.description}
            </p>
          )}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {recipe.servings && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{recipe.servings}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>servings</div>
              </div>
            )}
            {prepTime && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{prepTime}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>prep</div>
              </div>
            )}
            {cookTime && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{cookTime}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>cook</div>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{recipe.ingredients.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ingredients</div>
            </div>
          </div>
        </div>

        {/* Health notes */}
        {recipe.health_notes && recipe.health_notes.length > 0 && (
          <div className="card" style={{ padding: 16, background: '#fff5f5' }}>
            <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--red)' }}>
              💡 Health notes
            </p>
            <ul style={{ paddingLeft: 16, fontSize: 13, lineHeight: 1.7, color: 'var(--text)' }}>
              {recipe.health_notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Ingredients */}
        <div>
          <p className="section-label">Ingredients</p>
          <div className="card" style={{ padding: '0 16px' }}>
            {recipe.ingredients.map((ing, i) => (
              <div key={i} className="ingredient-item">
                <span className="ingredient-qty">
                  {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                </span>
                <span>{ing.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <p className="section-label">Instructions</p>
          <div className="card" style={{ padding: '0 16px' }}>
            {recipe.steps.map((step) => (
              <div key={step.step} className="step-item">
                <div className="step-number">{step.step}</div>
                <div>
                  <p className="step-text">{step.instruction}</p>
                  {step.duration_seconds && (
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      ⏱ {Math.round(step.duration_seconds / 60)} min
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source link */}
        <a
          href={recipe.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-full"
          style={{ textDecoration: 'none', marginBottom: 8 }}
        >
          📸 View original Reel
        </a>

        {/* Delete */}
        {confirmDelete ? (
          <div className="card" style={{ padding: 16, borderLeft: '3px solid var(--red)', marginBottom: 8 }}>
            <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Delete this recipe?</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-primary btn-full"
                style={{ background: 'var(--red)' }}
                disabled={deleting}
                onClick={() => void handleDelete()}
              >
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-secondary btn-full"
            style={{ color: 'var(--red)', marginBottom: 8 }}
            onClick={() => setConfirmDelete(true)}
          >
            Delete recipe
          </button>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
