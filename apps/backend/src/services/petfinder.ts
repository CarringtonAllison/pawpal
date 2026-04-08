import type { AgentResult, AgentError, RawPet } from '@pawpal/shared';
import { fetchWithRetry } from './httpClient.js';

interface PetfinderToken {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: PetfinderToken | null = null;

export function clearTokenCache(): void {
  cachedToken = null;
}

async function getToken(apiKey: string, secret: string): Promise<AgentResult<string>> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return { ok: true, data: cachedToken.accessToken };
  }

  let response: Response;
  try {
    response = await fetchWithRetry(
      'https://api.petfinder.com/v2/oauth2/token',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          client_id: apiKey,
          client_secret: secret,
        }),
      },
      { maxRetries: 1, timeoutMs: 5000 },
    );
  } catch {
    return makeError('PETFINDER_AUTH_FAILED', 'Could not connect to Petfinder');
  }

  if (!response.ok) {
    return makeError('PETFINDER_AUTH_FAILED', 'Petfinder authentication failed');
  }

  const data = await response.json() as { access_token: string; expires_in: number };
  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return { ok: true, data: cachedToken.accessToken };
}

export interface PetfinderSearchParams {
  type?: 'dog' | 'cat';
  location: string;
  distance: number;
  limit?: number;
}

export async function searchPetfinder(
  params: PetfinderSearchParams,
  apiKey: string,
  secret: string,
): Promise<AgentResult<RawPet[]>> {
  const tokenResult = await getToken(apiKey, secret);
  if (!tokenResult.ok) return tokenResult as AgentResult<RawPet[]>;

  const searchParams = new URLSearchParams({
    location: params.location,
    distance: String(params.distance),
    status: 'adoptable',
    limit: String(params.limit ?? 50),
  });
  if (params.type && params.type !== 'dog' && params.type !== 'cat') {
    // skip type filter for 'either'
  } else if (params.type) {
    searchParams.set('type', params.type);
  }

  const url = `https://api.petfinder.com/v2/animals?${searchParams}`;

  let response: Response;
  try {
    response = await fetchWithRetry(
      url,
      { headers: { Authorization: `Bearer ${tokenResult.data}` } },
    );
  } catch {
    return makeError('PETFINDER_UNAVAILABLE', 'Petfinder search timed out');
  }

  if (response.status === 429) {
    return makeError('PETFINDER_RATE_LIMITED', 'Petfinder rate limit reached');
  }

  if (!response.ok) {
    return makeError('PETFINDER_UNAVAILABLE', 'Petfinder returned an error');
  }

  const data = await response.json() as PetfinderResponse;
  const pets = (data.animals ?? []).map(normalizePetfinderAnimal);
  return { ok: true, data: pets };
}

function normalizePetfinderAnimal(animal: PetfinderAnimal): RawPet {
  return {
    id: `pf-${animal.id}`,
    source: 'petfinder',
    sourceUrl: animal.url ?? '',
    listingType: deriveListingType(animal),
    name: animal.name ?? 'Unknown',
    species: animal.type?.toLowerCase() === 'cat' ? 'cat' : 'dog',
    breedPrimary: animal.breeds?.primary ?? 'Mixed',
    breedMixed: animal.breeds?.mixed ?? true,
    age: normalizeAge(animal.age),
    gender: normalizeGender(animal.gender),
    size: normalizeSize(animal.size),
    description: sanitizeDescription(animal.description),
    photos: (animal.photos ?? []).map((p) => p.large ?? p.medium ?? p.small ?? '').filter(Boolean),
    shelterTraits: {
      environment: {
        children: animal.environment?.children ?? null,
        dogs: animal.environment?.dogs ?? null,
        cats: animal.environment?.cats ?? null,
      },
      attributes: {
        spayed_neutered: animal.attributes?.spayed_neutered ?? false,
        house_trained: animal.attributes?.house_trained ?? null,
        special_needs: animal.attributes?.special_needs ?? false,
        shots_current: animal.attributes?.shots_current ?? false,
      },
      tags: animal.tags ?? [],
    },
    shelter: {
      name: animal.organization?.name ?? animal.organization_id ?? 'Unknown Shelter',
      address: animal.contact?.address?.address1 ?? '',
      city: animal.contact?.address?.city ?? '',
      state: animal.contact?.address?.state ?? '',
      zip: animal.contact?.address?.postcode ?? '',
      phone: animal.contact?.phone ?? null,
      website: null,
      distanceMiles: animal.distance ?? 0,
    },
    listedAt: animal.published_at ?? null,
  };
}

function deriveListingType(animal: PetfinderAnimal): 'rescue' | 'foster' | 'breeder' {
  if (animal.status === 'adoptable' && animal.tags?.some((t) => t.toLowerCase().includes('foster'))) {
    return 'foster';
  }
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
  const map: Record<string, RawPet['size']> = { Small: 'small', Medium: 'medium', Large: 'large', 'Extra Large': 'xlarge' };
  return map[size ?? ''] ?? 'medium';
}

function sanitizeDescription(desc?: string | null): string | null {
  if (!desc) return null;
  return desc.replace(/<[^>]*>/g, '').trim() || null;
}

function makeError(
  code: 'PETFINDER_AUTH_FAILED' | 'PETFINDER_UNAVAILABLE' | 'PETFINDER_RATE_LIMITED',
  message: string,
): { ok: false; error: AgentError } {
  return {
    ok: false,
    error: {
      code,
      stage: 'search',
      message,
      recoverable: true,
    },
  };
}

// Petfinder API response types
interface PetfinderAnimal {
  id: number;
  type?: string;
  name?: string;
  breeds?: { primary?: string; mixed?: boolean };
  age?: string;
  gender?: string;
  size?: string;
  description?: string | null;
  photos?: Array<{ small?: string; medium?: string; large?: string }>;
  status?: string;
  tags?: string[];
  environment?: { children?: boolean | null; dogs?: boolean | null; cats?: boolean | null };
  attributes?: { spayed_neutered?: boolean; house_trained?: boolean | null; special_needs?: boolean; shots_current?: boolean };
  organization_id?: string;
  organization?: { name?: string };
  contact?: { phone?: string; address?: { address1?: string; city?: string; state?: string; postcode?: string } };
  url?: string;
  published_at?: string;
  distance?: number;
}

interface PetfinderResponse {
  animals?: PetfinderAnimal[];
}
