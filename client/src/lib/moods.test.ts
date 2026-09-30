import { describe, it, expect } from 'vitest'
import { moodReason, moodTagsFor, recommend } from './moods.js'
import type { Recipe } from './api.js'

function recipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    title: 'Test Recipe',
    ingredients: [],
    steps: [],
    instagram_url: 'https://www.instagram.com/reel/abc123/',
    ...overrides,
  }
}

const salmonBowl = recipe({
  id: 'salmon',
  title: 'Miso Salmon Bowl',
  description: 'Pan-seared salmon over rice',
  ingredients: [
    { name: 'salmon fillets', quantity: '2' },
    { name: 'white miso', quantity: '1', unit: 'tbsp' },
    { name: 'jasmine rice', quantity: '1', unit: 'cup' },
  ],
  prep_time_minutes: 10,
  cook_time_minutes: 20,
  health_notes: ['High protein', 'Rich in omega-3'],
  created_at: '2026-09-20T00:00:00Z',
})

const peanutNoodles = recipe({
  id: 'noodles',
  title: '5-Minute Peanut Noodles',
  ingredients: [
    { name: 'ramen noodles', quantity: '2', unit: 'packs' },
    { name: 'peanut butter', quantity: '2', unit: 'tbsp' },
    { name: 'sriracha', quantity: '1', unit: 'tsp' },
  ],
  prep_time_minutes: 2,
  cook_time_minutes: 3,
  health_notes: ['High carb'],
  created_at: '2026-09-25T00:00:00Z',
})

const gingerSoup = recipe({
  id: 'soup',
  title: 'Chicken Ginger Soup',
  ingredients: [
    { name: 'chicken thighs', quantity: '2' },
    { name: 'fresh ginger', quantity: '1', unit: 'inch' },
    { name: 'chicken broth', quantity: '4', unit: 'cups' },
  ],
  prep_time_minutes: 10,
  cook_time_minutes: 40,
  health_notes: ['Low sodium'],
  created_at: '2026-09-10T00:00:00Z',
})

describe('moodReason', () => {
  it('post-workout prefers the health note, then a protein ingredient', () => {
    expect(moodReason(salmonBowl, 'post-workout')).toBe('High protein')
    expect(moodReason(gingerSoup, 'post-workout')).toBe('packed with chicken thighs')
    expect(moodReason(peanutNoodles, 'post-workout')).toBeNull()
  })

  it('low-energy matches short total time or few ingredients', () => {
    expect(moodReason(peanutNoodles, 'low-energy')).toBe('ready in 5 min')
    expect(moodReason(salmonBowl, 'low-energy')).toBe('only 3 ingredients')
    const long = recipe({
      ingredients: new Array(10).fill({ name: 'thing', quantity: '1' }),
      prep_time_minutes: 30,
      cook_time_minutes: 30,
    })
    expect(moodReason(long, 'low-energy')).toBeNull()
  })

  it('stomachache excludes spicy dishes even when otherwise gentle', () => {
    expect(moodReason(peanutNoodles, 'stomachache')).toBeNull() // sriracha
    expect(moodReason(gingerSoup, 'stomachache')).toBe('gentle on the stomach')
  })

  it('sick names the soothing ingredient when there is one', () => {
    expect(moodReason(gingerSoup, 'sick')).toBe('has fresh ginger')
    expect(moodReason(salmonBowl, 'sick')).toBeNull()
  })

  it('stressed matches comfort food by what the dish is, not by an ingredient', () => {
    expect(moodReason(peanutNoodles, 'stressed')).toBe('comfort food') // "Noodles" in title
    expect(moodReason(salmonBowl, 'stressed')).toBeNull() // seared salmon is not comfort food
    expect(moodReason(recipe({ title: 'Creamy Miso Salmon Bowl' }), 'stressed')).toBe('comfort food')
    const cheeseAsIngredient = recipe({
      title: 'Grilled Chicken Salad',
      ingredients: [{ name: 'parmesan cheese', quantity: '2', unit: 'tbsp' }],
    })
    expect(moodReason(cheeseAsIngredient, 'stressed')).toBeNull()
  })

  it('does not tag a dish gentle just because rice or honey is an ingredient', () => {
    const bowl = recipe({
      title: 'Spicy Honey Chicken Bowl',
      ingredients: [{ name: 'rice', quantity: '1', unit: 'cup' }, { name: 'honey', quantity: '1', unit: 'tbsp' }],
    })
    expect(moodReason(bowl, 'stomachache')).toBeNull()
    expect(moodReason(bowl, 'sick')).toBeNull()
  })

  it('balanced surfaces the matching health note', () => {
    expect(moodReason(salmonBowl, 'balanced')).toBe('Rich in omega-3')
    expect(moodReason(gingerSoup, 'balanced')).toBe('Low sodium')
    expect(moodReason(peanutNoodles, 'balanced')).toBeNull()
  })

  it('handles null health_notes and description', () => {
    const sparse = recipe({ description: null as unknown as undefined, health_notes: null as unknown as undefined })
    expect(moodReason(sparse, 'balanced')).toBeNull()
    expect(moodTagsFor(sparse)).toEqual([])
  })
})

describe('moodTagsFor', () => {
  it('lists every mood the recipe fits', () => {
    // soup, chicken, ginger, low sodium — but 50 min, so not low-energy
    expect(moodTagsFor(gingerSoup).map((m) => m.id)).toEqual([
      'stomachache',
      'stressed',
      'post-workout',
      'sick',
      'balanced',
    ])
    expect(moodTagsFor(peanutNoodles).map((m) => m.id)).toEqual(['low-energy', 'stressed'])
  })
})

describe('recommend', () => {
  const all = [salmonBowl, peanutNoodles, gingerSoup]

  it('returns nothing when no mood is selected', () => {
    expect(recommend(all, [])).toEqual([])
  })

  it('returns only matching recipes with their reasons', () => {
    const result = recommend(all, ['post-workout'])
    expect(result.map((r) => r.recipe.id)).toEqual(['salmon', 'soup'])
    expect(result[0].reasons).toEqual(['High protein'])
  })

  it('ranks recipes matching more selected moods first', () => {
    const result = recommend(all, ['sick', 'post-workout'])
    // soup matches both; salmon matches post-workout only
    expect(result.map((r) => r.recipe.id)).toEqual(['soup', 'salmon'])
    expect(result[0].reasons).toHaveLength(2)
  })

  it('breaks ties by most recently saved', () => {
    const result = recommend(all, ['low-energy']) // noodles (5 min) and salmon (3 ingredients, 30 min)
    expect(result.map((r) => r.recipe.id)).toEqual(['noodles', 'salmon'])
  })

  it('respects the limit and caps reasons at two per card', () => {
    const result = recommend(all, ['stomachache', 'stressed', 'post-workout', 'sick'], 1)
    expect(result).toHaveLength(1)
    expect(result[0].recipe.id).toBe('soup')
    expect(result[0].reasons).toHaveLength(2)
  })
})
