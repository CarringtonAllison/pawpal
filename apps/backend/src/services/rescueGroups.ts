import type { AgentResult, AgentError, RawPet } from '@pawpal/shared';
import { fetchWithRetry } from './httpClient.js';

const RESCUE_GROUPS_BASE = 'https://api.rescuegroups.org/v5/public/animals/search/available';

export interface RescueGroupsSearchParams {
  species?: 'dog' | 'cat';
  postalCode: string;
  miles: number;
  limit?: number;
}

export async function searchRescueGroups(
  params: RescueGroupsSearchParams,
  apiKey?: string,
): Promise<AgentResult<RawPet[]>> {
  const body: Record<string, unknown> = {
    data: {
      filterRadius: {
        miles: params.miles,
        postalcode: params.postalCode,
      },
    },
  };

  if (params.species) {
    (body.data as Record<string, unknown>).filterSpecies = { species: params.species };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/vnd.api+json',
  };
  if (apiKey) {
    headers['Authorization'] = apiKey;
  }

  let response: Response;
  try {
    response = await fetchWithRetry(
      RESCUE_GROUPS_BASE,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      },
    );
  } catch {
    return makeError('Rescue shelter search timed out');
  }

  if (!response.ok) {
    return makeError('Rescue shelter search returned an error');
  }

  let data: RescueGroupsResponse;
  try {
    data = await response.json() as RescueGroupsResponse;
  } catch {
    return makeError('Rescue shelter returned invalid data');
  }

  const pets = (data.data ?? []).map(normalizeRescueGroupsAnimal);
  return { ok: true, data: pets };
}

function normalizeRescueGroupsAnimal(animal: RescueGroupsAnimal): RawPet {
  const attrs = animal.attributes ?? {};
  return {
    id: `rg-${animal.id}`,
    source: 'rescuegroups',
    sourceUrl: attrs.url ?? '',
    listingType: deriveListingType(animal),
    name: attrs.name ?? 'Unknown',
    species: attrs.species === 'Cat' ? 'cat' : 'dog',
    breedPrimary: attrs.breedPrimary ?? 'Mixed',
    breedMixed: attrs.breedSecondary != null,
    age: normalizeAge(attrs.ageGroup),
    gender: normalizeGender(attrs.sex),
    size: normalizeSize(attrs.sizeGroup),
    description: sanitizeDescription(attrs.descriptionText),
    photos: (attrs.pictureThumbnailUrl ? [attrs.pictureThumbnailUrl] : []).filter(Boolean),
    shelterTraits: {
      environment: {
        children: attrs.isKidsOk ?? null,
        dogs: attrs.isDogsOk ?? null,
        cats: attrs.isCatsOk ?? null,
      },
      attributes: {
        spayed_neutered: attrs.isNeedingFoster === false,
        house_trained: attrs.isHousetrained ?? null,
        special_needs: attrs.isSpecialNeeds ?? false,
        shots_current: attrs.isMicrochipped ?? false,
      },
      tags: [],
    },
    shelter: {
      name: attrs.orgName ?? 'Unknown Shelter',
      address: attrs.orgAddress ?? '',
      city: attrs.orgCity ?? '',
      state: attrs.orgState ?? '',
      zip: attrs.orgPostalcode ?? '',
      phone: attrs.orgPhone ?? null,
      website: attrs.orgUrl ?? null,
      distanceMiles: attrs.distance ?? 0,
    },
    listedAt: attrs.updatedDate ?? null,
  };
}

function deriveListingType(animal: RescueGroupsAnimal): 'rescue' | 'foster' | 'breeder' {
  const orgType = animal.relationships?.orgs?.data?.[0]?.attributes?.type ?? '';
  if (orgType.toLowerCase().includes('breeder')) return 'breeder';
  if (orgType.toLowerCase().includes('foster')) return 'foster';
  return 'rescue';
}

function normalizeAge(age?: string): RawPet['age'] {
  const map: Record<string, RawPet['age']> = { Baby: 'baby', Young: 'young', Adult: 'adult', Senior: 'senior' };
  return map[age ?? ''] ?? 'adult';
}

function normalizeGender(gender?: string): RawPet['gender'] {
  const map: Record<string, RawPet['gender']> = { Male: 'male', Female: 'female' };
  return map[gender ?? ''] ?? 'unknown';
}

function normalizeSize(size?: string): RawPet['size'] {
  const map: Record<string, RawPet['size']> = { Small: 'small', Medium: 'medium', Large: 'large', 'X-Large': 'xlarge' };
  return map[size ?? ''] ?? 'medium';
}

function sanitizeDescription(desc?: string | null): string | null {
  if (!desc) return null;
  return desc.replace(/<[^>]*>/g, '').trim() || null;
}

function makeError(message: string): { ok: false; error: AgentError } {
  return {
    ok: false,
    error: {
      code: 'RESCUE_GROUPS_UNAVAILABLE',
      stage: 'search',
      message,
      recoverable: true,
    },
  };
}

// RescueGroups API types
interface RescueGroupsAnimal {
  id: string;
  attributes?: {
    name?: string;
    species?: string;
    breedPrimary?: string;
    breedSecondary?: string | null;
    ageGroup?: string;
    sex?: string;
    sizeGroup?: string;
    descriptionText?: string | null;
    pictureThumbnailUrl?: string;
    url?: string;
    isKidsOk?: boolean | null;
    isDogsOk?: boolean | null;
    isCatsOk?: boolean | null;
    isNeedingFoster?: boolean;
    isHousetrained?: boolean | null;
    isSpecialNeeds?: boolean;
    isMicrochipped?: boolean;
    distance?: number;
    updatedDate?: string;
    orgName?: string;
    orgAddress?: string;
    orgCity?: string;
    orgState?: string;
    orgPostalcode?: string;
    orgPhone?: string;
    orgUrl?: string;
  };
  relationships?: {
    orgs?: {
      data?: Array<{
        attributes?: { type?: string };
      }>;
    };
  };
}

interface RescueGroupsResponse {
  data?: RescueGroupsAnimal[];
}
