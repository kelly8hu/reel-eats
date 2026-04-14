import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { getRecipes, type Recipe } from '../lib/api.js'
import BottomNav from '../components/BottomNav.js'

export default function Recipes() {
  const { session } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [pantryOnly, setPantryOnly] = useState(false)

  useEffect(() => {
    if (!session) return
    getRecipes().then((res) => {
      if (res.data) setRecipes(res.data)
      setLoading(false)
    })
  }, [session])

  const filtered = recipes.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(mins?: number) {
    if (!mins) return null
    if (mins < 60) return `${mins}m`
    return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
  }

  return (
    <div className="page">
      <div className="page-header px">
        <h1>My <span className="logo-dot">Recipes</span></h1>
        <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          {recipes.length} saved
        </span>
      </div>

      <div className="px stack stack-md">
        {/* Search */}
        <div className="search-bar">
          <span style={{ fontSize: 18 }}>🔍</span>
          <input
            placeholder="Search recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Pantry toggle */}
        <div className="toggle-row">
          <div>
            <div className="toggle-label">🥦 Use my pantry</div>
            <div className="toggle-sub">Show only recipes I can make now</div>
          </div>
          <label className="toggle">
            <input
              type="checkbox"
              checked={pantryOnly}
              onChange={(e) => setPantryOnly(e.target.checked)}
            />
            <span className="toggle-track" />
          </label>
        </div>

        {pantryOnly && (
          <div className="card" style={{ padding: '12px 14px', fontSize: 13, color: 'var(--text-muted)' }}>
            Pantry filtering coming soon — add ingredients in your Profile.
          </div>
        )}

        {/* Recipe grid */}
        {loading ? (
          <div className="stack stack-sm">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card" style={{ height: 80, opacity: 0.4 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? '🔍' : '📭'}</div>
            <p>{search ? `No recipes matching "${search}"` : 'No recipes yet.\nSave one from the home screen!'}</p>
          </div>
        ) : (
          <div className="recipe-grid">
            {filtered.map((recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="recipe-card">
                {recipe.thumbnail_url ? (
                  <img
                    src={recipe.thumbnail_url}
                    alt={recipe.title}
                    className="recipe-card-thumb"
                  />
                ) : (
                  <div className="recipe-card-thumb">🍽️</div>
                )}
                <div className="recipe-card-body">
                  <div className="recipe-card-title">{recipe.title}</div>
                  <div className="recipe-card-meta">
                    {[formatTime(recipe.prep_time_minutes), formatTime(recipe.cook_time_minutes)]
                      .filter(Boolean)
                      .join(' · ') || `${recipe.ingredients.length} ingredients`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
