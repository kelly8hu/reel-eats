import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Recipe } from '../lib/api.js'

function formatTime(mins?: number) {
  if (!mins) return null
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim()
}

interface Props {
  recipe: Recipe
  /** Optional one-line reason shown under the title (mood recommendations) */
  reason?: string
}

export default function RecipeCard({ recipe, reason }: Props) {
  const [thumbError, setThumbError] = useState(false)
  return (
    <Link to={`/recipes/${recipe.id}`} className="recipe-card">
      {recipe.thumbnail_url && !thumbError ? (
        <img
          src={recipe.thumbnail_url}
          alt={recipe.title}
          className="recipe-card-thumb"
          onError={() => setThumbError(true)}
        />
      ) : (
        <div className="recipe-card-thumb">🍽️</div>
      )}
      <div className="recipe-card-body">
        <div className="recipe-card-title">{recipe.title}</div>
        {reason ? (
          <div className="recipe-card-reason">{reason}</div>
        ) : (
          <div className="recipe-card-meta">
            {[formatTime(recipe.prep_time_minutes), formatTime(recipe.cook_time_minutes)]
              .filter(Boolean)
              .join(' · ') || `${recipe.ingredients.length} ingredients`}
          </div>
        )}
      </div>
    </Link>
  )
}
