import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Supabase chain mock ───────────────────────────────────────────────────────
// Supports both terminal patterns:
//   .insert().select().single()   → mockSingle resolves
//   .select().eq().eq().single()  → mockSingle resolves
//   .update().eq()                → mockEq resolves (terminal for updates)
//   .select().eq().order()        → mockOrder resolves (terminal for list queries)

const mockSingle = vi.fn()
const mockOrder = vi.fn()
const mockEq = vi.fn()

const chain = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: mockEq,
  order: mockOrder,
  single: mockSingle,
}

chain.insert.mockReturnValue(chain)
chain.select.mockReturnValue(chain)
chain.update.mockReturnValue(chain)
mockEq.mockReturnValue(chain)          // default: return chain for further chaining

vi.mock('../lib/supabaseAdmin.js', () => ({
  supabaseAdmin: { from: vi.fn().mockReturnValue(chain) },
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString()

const mockJobData = {
  id: '11111111-1111-1111-1111-111111111111',
  status: 'pending',
  recipe_id: undefined,
  error: undefined,
  created_at: NOW,
  updated_at: NOW,
}

const mockRecipeData = {
  id: '22222222-2222-2222-2222-222222222222',
  title: 'Simple Pasta',
  description: 'Quick and easy.',
  ingredients: [{ name: 'flour', quantity: '2 cups' }],
  steps: [{ step: 1, instruction: 'Mix ingredients.' }],
  servings: 2,
  prep_time_minutes: 10,
  cook_time_minutes: 20,
  health_notes: ['high carb'],
  instagram_url: 'https://www.instagram.com/reel/abc123',
  thumbnail_url: 'https://cdn.example.com/thumb.jpg',
  created_at: NOW,
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('createJob', () => {
  beforeEach(() => { mockSingle.mockReset() })

  it('returns a parsed Job on success', async () => {
    mockSingle.mockResolvedValue({ data: mockJobData, error: null })
    const { createJob } = await import('./db.js')
    const job = await createJob('user-abc', 'https://www.instagram.com/reel/abc123/')
    expect(job.id).toBe(mockJobData.id)
    expect(job.status).toBe('pending')
  })

  it('throws when Supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB down' } })
    const { createJob } = await import('./db.js')
    await expect(createJob('user-abc', 'https://www.instagram.com/reel/abc123/')).rejects.toThrow('Failed to create job: DB down')
  })
})

describe('updateJob', () => {
  beforeEach(() => { mockEq.mockReset(); mockEq.mockReturnValue(chain) })

  it('resolves without throwing on success', async () => {
    // Make the terminal eq() call resolve (update has one eq at the end)
    mockEq.mockResolvedValueOnce({ data: null, error: null })
    const { updateJob } = await import('./db.js')
    await expect(updateJob('job-id', { status: 'processing' })).resolves.toBeUndefined()
  })

  it('throws when Supabase returns an error', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: { message: 'constraint violation' } })
    const { updateJob } = await import('./db.js')
    await expect(updateJob('job-id', { status: 'failed' })).rejects.toThrow('Failed to update job')
  })
})

describe('getJob', () => {
  beforeEach(() => { mockSingle.mockReset() })

  it('returns a parsed Job when found', async () => {
    mockSingle.mockResolvedValue({ data: mockJobData, error: null })
    const { getJob } = await import('./db.js')
    const job = await getJob('job-id', 'user-id')
    expect(job).not.toBeNull()
    expect(job!.id).toBe(mockJobData.id)
  })

  it('returns null on PGRST116 (row not found)', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
    const { getJob } = await import('./db.js')
    const result = await getJob('missing-id', 'user-id')
    expect(result).toBeNull()
  })

  it('throws on unexpected Supabase errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: '500', message: 'Server error' } })
    const { getJob } = await import('./db.js')
    await expect(getJob('job-id', 'user-id')).rejects.toThrow('Failed to fetch job')
  })
})

describe('saveRecipe', () => {
  beforeEach(() => { mockSingle.mockReset() })

  it('returns a parsed Recipe on success', async () => {
    mockSingle.mockResolvedValue({ data: mockRecipeData, error: null })
    const { saveRecipe } = await import('./db.js')
    const recipe = await saveRecipe(mockRecipeData as Parameters<typeof saveRecipe>[0], 'user-id')
    expect(recipe.title).toBe('Simple Pasta')
    expect(recipe.ingredients).toHaveLength(1)
  })

  it('throws when Supabase returns an error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'unique constraint' } })
    const { saveRecipe } = await import('./db.js')
    await expect(
      saveRecipe(mockRecipeData as Parameters<typeof saveRecipe>[0], 'user-id')
    ).rejects.toThrow('Failed to save recipe')
  })
})

describe('getRecipes', () => {
  beforeEach(() => { mockOrder.mockReset() })

  it('returns an array of parsed Recipes', async () => {
    mockOrder.mockResolvedValue({ data: [mockRecipeData], error: null })
    const { getRecipes } = await import('./db.js')
    const recipes = await getRecipes('user-id')
    expect(recipes).toHaveLength(1)
    expect(recipes[0].title).toBe('Simple Pasta')
  })

  it('returns empty array when no recipes exist', async () => {
    mockOrder.mockResolvedValue({ data: null, error: null })
    const { getRecipes } = await import('./db.js')
    const recipes = await getRecipes('user-id')
    expect(recipes).toEqual([])
  })

  it('throws on Supabase error', async () => {
    mockOrder.mockResolvedValue({ data: null, error: { message: 'timeout' } })
    const { getRecipes } = await import('./db.js')
    await expect(getRecipes('user-id')).rejects.toThrow('Failed to fetch recipes')
  })
})

describe('getRecipe', () => {
  beforeEach(() => { mockSingle.mockReset() })

  it('returns a Recipe when found', async () => {
    mockSingle.mockResolvedValue({ data: mockRecipeData, error: null })
    const { getRecipe } = await import('./db.js')
    const recipe = await getRecipe('recipe-id', 'user-id')
    expect(recipe).not.toBeNull()
    expect(recipe!.title).toBe('Simple Pasta')
  })

  it('returns null on PGRST116', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
    const { getRecipe } = await import('./db.js')
    const result = await getRecipe('missing-id', 'user-id')
    expect(result).toBeNull()
  })
})
