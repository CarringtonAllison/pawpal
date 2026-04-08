import type { RawPet } from '@pawpal/shared';

export function deduplicate(pets: RawPet[]): RawPet[] {
  const kept: RawPet[] = [];
  const dropped: Set<number> = new Set();

  for (let i = 0; i < pets.length; i++) {
    if (dropped.has(i)) continue;

    let best = pets[i];

    for (let j = i + 1; j < pets.length; j++) {
      if (dropped.has(j)) continue;

      if (isDuplicate(best, pets[j])) {
        // Keep Petfinder version (richer data), merge from the other
        if (best.source === 'petfinder') {
          best = mergePets(best, pets[j]);
        } else {
          best = mergePets(pets[j], best);
        }
        dropped.add(j);
      }
    }

    kept.push(best);
  }

  return kept;
}

function isDuplicate(a: RawPet, b: RawPet): boolean {
  // Only deduplicate across different sources
  if (a.source === b.source) return false;

  // Must be same species
  if (a.species !== b.species) return false;

  const nameA = a.name.trim().toLowerCase();
  const nameB = b.name.trim().toLowerCase();
  const nameMatch = nameA === nameB;

  if (!nameMatch) return false;

  // Same name + same shelter (by name + zip)
  const shelterMatch =
    a.shelter.name.trim().toLowerCase() === b.shelter.name.trim().toLowerCase() &&
    a.shelter.zip === b.shelter.zip;

  if (shelterMatch) return true;

  // Same name + same breed + same zip (different shelter name spellings)
  const breedMatch = a.breedPrimary.trim().toLowerCase() === b.breedPrimary.trim().toLowerCase();
  if (breedMatch && a.shelter.zip === b.shelter.zip) return true;

  return false;
}

function mergePets(primary: RawPet, secondary: RawPet): RawPet {
  // Merge photos: add unique secondary photos
  const photoSet = new Set(primary.photos);
  const mergedPhotos = [...primary.photos];
  for (const photo of secondary.photos) {
    if (!photoSet.has(photo)) {
      mergedPhotos.push(photo);
    }
  }

  // Merge tags: union
  const tagSet = new Set(primary.shelterTraits.tags.map((t) => t.toLowerCase()));
  const mergedTags = [...primary.shelterTraits.tags];
  for (const tag of secondary.shelterTraits.tags) {
    if (!tagSet.has(tag.toLowerCase())) {
      mergedTags.push(tag);
    }
  }

  return {
    ...primary,
    photos: mergedPhotos,
    shelterTraits: {
      ...primary.shelterTraits,
      tags: mergedTags,
    },
  };
}
