export type Species = 'dog' | 'cat';

export type PetAge = 'baby' | 'young' | 'adult' | 'senior';

export type PetGender = 'male' | 'female' | 'unknown';

export type PetSize = 'small' | 'medium' | 'large' | 'xlarge';

export type ListingType = 'rescue' | 'foster' | 'breeder';

export type PetSource = 'petfinder' | 'rescuegroups';

export interface AnimalAttributes {
  environment: {
    children: boolean | null;
    dogs: boolean | null;
    cats: boolean | null;
  };
  attributes: {
    spayed_neutered: boolean;
    house_trained: boolean | null;
    special_needs: boolean;
    shots_current: boolean;
  };
  tags: string[];
}

export type TraitScale = 1 | 2 | 3 | 4 | 5;

export interface BreedTraits {
  species: Species;
  aliases: string[];

  // Physical
  sizeGroup: PetSize;
  weightRangeLbs: [number, number];
  coatLength: 'short' | 'medium' | 'long' | 'hairless';
  hypoallergenic: boolean;
  sheddingLevel: TraitScale;

  // Temperament
  energyLevel: TraitScale;
  affectionLevel: TraitScale;
  trainability: TraitScale;
  barkingLevel: TraitScale;
  playfulness: TraitScale;
  adaptability: TraitScale;

  // Compatibility
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
  goodWithStrangers: boolean;
  apartmentFriendly: boolean;

  // Care
  exerciseNeedsMinPerDay: number;
  groomingNeedsLevel: TraitScale;
  separationAnxietyRisk: 'low' | 'medium' | 'high';
  experienceRequired: 'none' | 'some' | 'experienced';

  // Display
  temperamentTags: string[];
}

export interface EnrichedPet {
  id: string;
  source: PetSource;
  sourceUrl: string;
  listingType: ListingType;

  name: string;
  species: Species;
  breedPrimary: string;
  breedMixed: boolean;
  age: PetAge;
  gender: PetGender;
  size: PetSize;
  description: string | null;

  photos: string[];
  breedPhotos: string[];

  shelterTraits: AnimalAttributes;
  breedTraits: BreedTraits | null;

  shelter: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string | null;
    website: string | null;
    distanceMiles: number;
  };

  listedAt: string | null;

  matchScore: number;
  dimensionScores: Record<string, number>;

  matchExplanation: string | null;
  strengthLabels: string[];
}

export interface RawPet {
  id: string;
  source: PetSource;
  sourceUrl: string;
  listingType: ListingType;
  name: string;
  species: Species;
  breedPrimary: string;
  breedMixed: boolean;
  age: PetAge;
  gender: PetGender;
  size: PetSize;
  description: string | null;
  photos: string[];
  shelterTraits: AnimalAttributes;
  shelter: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string | null;
    website: string | null;
    distanceMiles: number;
  };
  listedAt: string | null;
}
