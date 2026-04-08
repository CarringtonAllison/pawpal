import type { AgentResult, EnrichedPet, UserPreferences } from '@pawpal/shared';
import type { ScoredPet } from './matchingAgent.js';
import { getAnthropicClient } from '../lib/anthropic.js';

export async function enrichmentAgent(
  pets: ScoredPet[],
  prefs: UserPreferences,
): Promise<AgentResult<EnrichedPet[]>> {
  const enriched: EnrichedPet[] = await Promise.all(
    pets.map((pet) => enrichSinglePet(pet, prefs)),
  );

  return { ok: true, data: enriched };
}

async function enrichSinglePet(
  pet: ScoredPet,
  prefs: UserPreferences,
): Promise<EnrichedPet> {
  let matchExplanation: string | null = null;
  let strengthLabels: string[] = [];

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: [{
        type: 'text',
        text: `You generate short, friendly pet match explanations. Given a pet's traits and a user's preferences, write 1-2 sentences explaining why this pet is a good match. Also return 2-3 short strength labels. Respond in JSON: {"explanation": "...", "strengths": ["...", "..."]}`,
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{
        role: 'user',
        content: `Pet: ${pet.name}, ${pet.breedPrimary}, ${pet.age}, ${pet.size}, match score ${pet.matchScore}%. Tags: ${pet.shelterTraits.tags.join(', ') || 'none'}. User wants: ${prefs.temperamentStyle}, ${prefs.activityLevel} activity, ${prefs.livingSpace} living space.`,
      }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const parsed = JSON.parse(text) as { explanation?: string; strengths?: string[] };
    matchExplanation = parsed.explanation ?? null;
    strengthLabels = parsed.strengths ?? [];
  } catch {
    // Enrichment failure is non-fatal — return pet without explanation
  }

  return {
    id: pet.id,
    source: pet.source,
    sourceUrl: pet.sourceUrl,
    listingType: pet.listingType,
    name: pet.name,
    species: pet.species,
    breedPrimary: pet.breedPrimary,
    breedMixed: pet.breedMixed,
    age: pet.age,
    gender: pet.gender,
    size: pet.size,
    description: pet.description,
    photos: pet.photos,
    breedPhotos: [], // populated later by breed photo cache
    shelterTraits: pet.shelterTraits,
    breedTraits: pet.breedTraits,
    shelter: pet.shelter,
    listedAt: pet.listedAt,
    matchScore: pet.matchScore,
    dimensionScores: pet.dimensionScores,
    matchExplanation,
    strengthLabels,
  };
}
