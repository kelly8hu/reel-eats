import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── External boundary mocks ──────────────────────────────────────────────────

const mockCreate = vi.fn()
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
  })),
}))

// ── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_INPUT = {
  instagramUrl: 'https://www.instagram.com/reel/abc123',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  caption: 'Quick pasta recipe!',
  apifyTranscript: 'Making pasta today.',
  whisperTranscript: 'Add two cups of flour. Mix in eggs. Knead for ten minutes.',
}

const CLAUDE_TOOL_RESPONSE = {
  content: [
    {
      type: 'tool_use',
      name: 'extract_recipe',
      input: {
        title: 'Simple Pasta',
        description: 'A quick homemade pasta.',
        ingredients: [
          { name: 'flour', quantity: '2 cups' },
          { name: 'eggs', quantity: '2' },
        ],
        steps: [
          { step: 1, instruction: 'Add two cups of flour.' },
          { step: 2, instruction: 'Mix in eggs.' },
          { step: 3, instruction: 'Knead for ten minutes.' },
        ],
        servings: 2,
        health_notes: ['high carb'],
      },
    },
  ],
  stop_reason: 'tool_use',
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('extractRecipe', () => {
  beforeEach(() => {
    mockCreate.mockReset()
  })

  it('returns a validated Recipe on success', async () => {
    mockCreate.mockResolvedValue(CLAUDE_TOOL_RESPONSE)

    const { extractRecipe } = await import('./ai.js')
    const recipe = await extractRecipe(VALID_INPUT)

    expect(recipe.title).toBe('Simple Pasta')
    expect(recipe.ingredients).toHaveLength(2)
    expect(recipe.steps).toHaveLength(3)
    expect(recipe.instagram_url).toBe(VALID_INPUT.instagramUrl)
    expect(recipe.thumbnail_url).toBe(VALID_INPUT.thumbnailUrl)
  })

  it('calls Claude with the correct model and tool choice', async () => {
    mockCreate.mockResolvedValue(CLAUDE_TOOL_RESPONSE)

    const { extractRecipe } = await import('./ai.js')
    await extractRecipe(VALID_INPUT)

    const callArgs = mockCreate.mock.calls[0][0] as Record<string, unknown>
    expect(callArgs.model).toBe('claude-haiku-4-5')
    expect(callArgs.tool_choice).toEqual({ type: 'tool', name: 'extract_recipe' })
  })

  it('includes all three transcript sources in the prompt', async () => {
    mockCreate.mockResolvedValue(CLAUDE_TOOL_RESPONSE)

    const { extractRecipe } = await import('./ai.js')
    await extractRecipe(VALID_INPUT)

    const callArgs = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> }
    const prompt = callArgs.messages[0].content
    expect(prompt).toContain(VALID_INPUT.caption)
    expect(prompt).toContain(VALID_INPUT.apifyTranscript)
    expect(prompt).toContain(VALID_INPUT.whisperTranscript)
  })

  it('throws when Claude does not return a tool_use block', async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'I cannot extract a recipe from this.' }],
      stop_reason: 'end_turn',
    })

    const { extractRecipe } = await import('./ai.js')
    await expect(extractRecipe(VALID_INPUT)).rejects.toThrow(
      'Claude did not return a structured recipe'
    )
  })

  it('throws when Claude output fails schema validation', async () => {
    mockCreate.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: 'extract_recipe',
          // Missing required 'ingredients' and 'steps'
          input: { title: 'Incomplete Recipe' },
        },
      ],
    })

    const { extractRecipe } = await import('./ai.js')
    await expect(extractRecipe(VALID_INPUT)).rejects.toThrow('invalid data')
  })
})
