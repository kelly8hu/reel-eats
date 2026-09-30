import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth.js'
import { getRecipes, type Recipe } from '../lib/api.js'
import BottomNav from '../components/BottomNav.js'
import RecipeCard from '../components/RecipeCard.js'

export default function Recipes() {
  const { session } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
