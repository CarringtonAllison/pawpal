import type { BreedTraits } from '@pawpal/shared';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let traitsDb: Record<string, BreedTraits> | null = null;

function loadTraits(): Record<string, BreedTraits> {
  if (!traitsDb) {
    const raw = readFileSync(join(__dirname, '../../../data/breedTraits.json'), 'utf-8');
    traitsDb = JSON.parse(raw) as Record<string, BreedTraits>;
  }
  return traitsDb;
}

export function getBreedTraits(breedName: string, species: 'dog' | 'cat'): BreedTraits | null {
  const db = loadTraits();
  const normalized = breedName.trim().toLowerCase();

  // Direct key match (e.g., "golden_retriever")
  const keyForm = normalized.replace(/\s+/g, '_');
  if (db[keyForm] && db[keyForm].species === species) {
    return db[keyForm];
  }

  // Search by alias
  for (const traits of Object.values(db)) {
    if (traits.species !== species) continue;
    if (traits.aliases.some((a) => a.toLowerCase() === normalized)) {
      return traits;
    }
  }

  // Partial match (breed name contains or is contained by alias)
  for (const traits of Object.values(db)) {
    if (traits.species !== species) continue;
    if (traits.aliases.some((a) => {
      const aLower = a.toLowerCase();
      return aLower.includes(normalized) || normalized.includes(aLower);
    })) {
      return traits;
    }
  }

  return null;
}

export function resetBreedTraitsCache(): void {
  traitsDb = null;
}
