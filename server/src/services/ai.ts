import Anthropic from '@anthropic-ai/sdk'
import { RecipeSchema, type Recipe } from '@reel-eats/shared'
import { logger } from '../lib/logger.js'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? ''

if (!ANTHROPIC_API_KEY) {
  throw new Error('Missing required env var: ANTHROPIC_API_KEY')
}

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

export interface RecipeExtractionInput {
  instagramUrl: string
  thumbnailUrl?: string
  caption: string
  apifyTranscript: string
  whisperTranscript: string
}

/**
 * Extract a structured recipe from reel metadata + transcripts.
 * All Claude API calls go through this service — never call Anthropic directly from routes.
 */
export async function extractRecipe(input: RecipeExtractionInput): Promise<Recipe> {
  logger.debug({ instagramUrl: input.instagramUrl }, 'Extracting recipe with Claude')

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2048,
    tools: [RECIPE_TOOL],
    tool_choice: { type: 'tool', name: 'extract_recipe' },
    messages: [{ role: 'user', content: buildPrompt(input) }],
  })

  const toolBlock = response.content.find((b) => b.type === 'tool_use')
  if (!toolBlock || toolBlock.type !== 'tool_use') {
    throw new Error('Claude did not return a structured recipe')
  }

  const parsed = RecipeSchema.safeParse({
    ...(toolBlock.input as Record<string, unknown>),
    instagram_url: input.instagramUrl,
    thumbnail_url: input.thumbnailUrl,
  })

  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues }, 'Claude output failed schema validation')
    throw new Error('Recipe extraction produced invalid data')
  }

  logger.debug({ title: parsed.data.title }, 'Recipe extraction complete')
  return parsed.data
}

function buildPrompt(input: RecipeExtractionInput): string {
  return `Extract a complete recipe from this Instagram Reel.

Caption:
${input.caption || '(none)'}

Auto-generated transcript (from platform):
${input.apifyTranscript || '(none)'}

Audio transcript (from Whisper — most detailed):
${input.whisperTranscript || '(none)'}

Use all three sources. Whisper is the most accurate. Extract every ingredient, quantity, and step. Add health_notes for notable observations (e.g. high protein, dairy-free, high sodium).`
}

const RECIPE_TOOL: Anthropic.Tool = {
  name: 'extract_recipe',
  description: 'Extract structured recipe data from video transcript and caption',
  input_schema: {
    type: 'object' as const,
    properties: {
      title: { type: 'string', description: 'Recipe name' },
      description: { type: 'string', description: 'One-sentence description of the dish' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            quantity: { type: 'string' },
            unit: { type: 'string' },
          },
          required: ['name', 'quantity'],
        },
      },
      steps: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            step: { type: 'number', description: 'Step number starting at 1' },
            instruction: { type: 'string' },
            duration_seconds: { type: 'number' },
          },
          required: ['step', 'instruction'],
        },
      },
      servings: { type: 'number' },
      prep_time_minutes: { type: 'number' },
      cook_time_minutes: { type: 'number' },
      health_notes: {
        type: 'array',
        items: { type: 'string' },
        description: 'Notable health observations, e.g. "high protein", "dairy-free"',
      },
    },
    required: ['title', 'ingredients', 'steps'],
  },
}
