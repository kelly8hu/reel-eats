import type { Recipe } from './api.js'

/**
 * Mood-based recommendations, computed client-side from data the pipeline
 * already extracts (health notes, times, ingredients, title/description).
 * No server call — the cookbook is filtered locally.
 */

export type MoodId = 'low-energy' | 'stomachache' | 'stressed' | 'post-workout' | 'sick' | 'balanced'

export interface Mood {
  id: MoodId
  emoji: string
  label: string
}

export const MOODS: Mood[] = [
  { id: 'low-energy', emoji: '😴', label: 'Low energy' },
  { id: 'stomachache', emoji: '🤢', label: 'Stomachache' },
  { id: 'stressed', emoji: '😰', label: 'Stressed' },
  { id: 'post-workout', emoji: '💪', label: 'Post-workout' },
  { id: 'sick', emoji: '🤒', label: 'Sick' },
  { id: 'balanced', emoji: '🧘', label: 'Balanced' },
]

export interface Recommendation {
  recipe: Recipe
  /** One reason per matched mood, e.g. "High protein", "ready in 15 min" */
  reasons: string[]
}

// ── Text helpers ─────────────────────────────────────────────────────────────

/** Everything we know about the recipe, including ingredient names */
function corpus(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.description ?? '',
    ...(recipe.health_notes ?? []),
    ...recipe.ingredients.map((i) => i.name),
  ]
    .join(' ')
    .toLowerCase()
}

/**
 * What the dish *is* — title, description, health notes — without the
 * ingredient list. Used for identity-style rules (comfort food, soup) so
 * that an incidental "rice" or "cheese" ingredient doesn't tag every recipe.
 */
function identity(recipe: Recipe): string {
  return [recipe.title, recipe.description ?? '', ...(recipe.health_notes ?? [])]
    .join(' ')
    .toLowerCase()
}

/** Returns the first health note containing any of the keywords, else null */
function noteMatching(recipe: Recipe, re: RegExp): string | null {
  return (recipe.health_notes ?? []).find((n) => re.test(n.toLowerCase())) ?? null
}

/** Returns the first ingredient name matching, else null */
function ingredientMatching(recipe: Recipe, re: RegExp): string | null {
  const hit = recipe.ingredients.find((i) => re.test(i.name.toLowerCase()))
  return hit ? hit.name.toLowerCase() : null
}

function totalMinutes(recipe: Recipe): number | null {
  const prep = recipe.prep_time_minutes ?? 0
  const cook = recipe.cook_time_minutes ?? 0
  const total = prep + cook
  return total > 0 ? total : null
}

// ── Rules ────────────────────────────────────────────────────────────────────

const PROTEIN_NOTE = /protein/
const PROTEIN_INGREDIENT =
  /\b(chicken|salmon|tuna|shrimp|prawn|beef|steak|turkey|pork|egg|eggs|tofu|tempeh|lentil|lentils|chickpea|chickpeas|greek yogurt|cottage cheese|protein)\b/

const HARSH = /\b(spicy|chili|chile|chilli|jalape\w*|sriracha|hot sauce|deep[- ]fried|fried)\b/
const GENTLE =
  /\b(soup|broth|congee|porridge|oatmeal|oats|banana|toast|steamed|plain|light|gentle|easy to digest|low[- ]fat|bland)\b/

const SOOTHING = /\b(soup|broth|congee|noodle soup|tea|immune|warming)\b/
const SOOTHING_INGREDIENT = /\b(ginger|turmeric|lemon)\b/

const COMFORT =
  /\b(pasta|noodle|noodles|mac and cheese|cheesy|soup|stew|baked|chocolate|cookie|cookies|brownie|comfort|cozy|creamy|mashed|risotto|curry|casserole|ramen|lasagna)\b/

const BALANCED_NOTE =
  /\b(balanced|fiber|fibre|whole grain|vegetable|vegetables|veggie|low sodium|healthy|nutrient|antioxidant|antioxidants|vitamin|lean|omega|heart[- ]healthy)\b/
const QUICK_TITLE = /\b(quick|easy|5[- ]minute|10[- ]minute|15[- ]minute|no[- ]cook|one[- ]pan|one[- ]pot|sheet pan)\b/

/**
 * Why this recipe fits the mood, or null if it doesn't.
 * The string is shown to the user under the recipe card.
 */
export function moodReason(recipe: Recipe, mood: MoodId): string | null {
  const everything = corpus(recipe)
  const dish = identity(recipe)
  const mins = totalMinutes(recipe)
  const n = recipe.ingredients.length

  switch (mood) {
    case 'low-energy': {
      if (mins !== null && mins <= 20) return `ready in ${mins} min`
      if (n > 0 && n <= 5 && (mins === null || mins <= 30)) return `only ${n} ingredients`
      if (QUICK_TITLE.test(recipe.title.toLowerCase())) return 'quick and easy'
      return null
    }
    case 'post-workout': {
      const note = noteMatching(recipe, PROTEIN_NOTE)
      if (note) return note
      const ing = ingredientMatching(recipe, PROTEIN_INGREDIENT)
      if (ing) return `packed with ${ing}`
      return null
    }
    case 'stomachache': {
      if (HARSH.test(everything)) return null // an ingredient can disqualify
      if (GENTLE.test(dish)) return 'gentle on the stomach' // but only the dish itself qualifies
      return null
    }
    case 'sick': {
      const ing = ingredientMatching(recipe, SOOTHING_INGREDIENT)
      if (ing) return `has ${ing}`
      if (SOOTHING.test(dish)) return 'warm and soothing'
      return null
    }
    case 'stressed': {
      if (COMFORT.test(dish)) return 'comfort food'
      return null
    }
    case 'balanced': {
      const note = noteMatching(recipe, BALANCED_NOTE)
      if (note) return note
      if (/\b(vegetable|vegetables|veggie|salad|greens)\b/.test(dish)) return 'plenty of vegetables'
      return null
    }
  }
}

/** Every mood a recipe fits — used for the "Good for" tags on the detail page */
export function moodTagsFor(recipe: Recipe): Mood[] {
  return MOODS.filter((m) => moodReason(recipe, m.id) !== null)
}

/**
 * Recipes matching ANY selected mood, ranked by how many moods they match,
 * then most recently saved. Empty selection → empty list.
 */
export function recommend(recipes: Recipe[], selected: MoodId[], limit = 4): Recommendation[] {
  if (selected.length === 0) return []

  const scored: Array<Recommendation & { created: number }> = []
  for (const recipe of recipes) {
    const reasons = selected
      .map((m) => moodReason(recipe, m))
      .filter((r): r is string => r !== null)
    if (reasons.length === 0) continue
    scored.push({
      recipe,
      reasons: Array.from(new Set(reasons)).slice(0, 2), // keep the card line short
      created: recipe.created_at ? Date.parse(recipe.created_at) : 0,
    })
  }

  scored.sort((a, b) => b.reasons.length - a.reasons.length || b.created - a.created)
  return scored.slice(0, limit).map(({ recipe, reasons }) => ({ recipe, reasons }))
}
