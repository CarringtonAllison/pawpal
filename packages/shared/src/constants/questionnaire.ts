export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionDefinition {
  id: string;
  step: number;
  field: string;
  title: string;
  subtitle?: string;
  type: 'text' | 'single' | 'multi';
  options?: QuestionOption[];
  placeholder?: string;
  validation?: {
    required: boolean;
    pattern?: string;
    maxLength?: number;
  };
  conditional?: {
    field: string;
    values: string[];
  };
}

export const QUESTIONNAIRE: QuestionDefinition[] = [
  {
    id: 'zip',
    step: 0,
    field: 'zipCode',
    title: "What's your zip code?",
    subtitle: "We'll find pets available near you",
    type: 'text',
    placeholder: '10001',
    validation: {
      required: true,
      pattern: '^\\d{5}$',
    },
  },
  {
    id: 'pet-type',
    step: 1,
    field: 'petType',
    title: 'Are you looking for a dog or a cat?',
    type: 'single',
    options: [
      { value: 'dog', label: 'Dog', description: 'Loyal companion' },
      { value: 'cat', label: 'Cat', description: 'Independent friend' },
      { value: 'either', label: 'Either', description: "I'm open to both" },
    ],
  },
  {
    id: 'living-space',
    step: 2,
    field: 'livingSpace',
    title: 'What kind of living space do you have?',
    type: 'single',
    options: [
      { value: 'apartment', label: 'Apartment', description: 'No yard access' },
      { value: 'small_yard', label: 'Small Yard', description: 'Townhouse or small lot' },
      { value: 'large_yard', label: 'Large Yard', description: 'Suburban home' },
      { value: 'rural', label: 'Rural', description: 'Acreage or farm' },
    ],
  },
  {
    id: 'activity',
    step: 3,
    field: 'activityLevel',
    title: 'How active is your lifestyle?',
    type: 'single',
    options: [
      { value: 'sedentary', label: 'Sedentary', description: 'Mostly indoors' },
      { value: 'low', label: 'Low', description: 'Short daily walks' },
      { value: 'moderate', label: 'Moderate', description: 'Regular exercise' },
      { value: 'high', label: 'High', description: 'Running, hiking, very active' },
    ],
  },
  {
    id: 'experience',
    step: 4,
    field: 'experience',
    title: "What's your experience with pets?",
    type: 'single',
    options: [
      { value: 'none', label: 'None', description: 'First-time pet owner' },
      { value: 'some', label: 'Some', description: 'Had a pet growing up' },
      { value: 'experienced', label: 'Experienced', description: 'Currently or recently owned pets' },
      { value: 'expert', label: 'Expert', description: 'Trained or worked with animals' },
    ],
  },
  {
    id: 'allergies',
    step: 5,
    field: 'allergies',
    title: 'Do you have any pet allergies?',
    type: 'single',
    options: [
      { value: 'none', label: 'No allergies' },
      { value: 'mild', label: 'Mild', description: 'Prefer low-shedding breeds' },
      { value: 'strict', label: 'Strict', description: 'Must be hypoallergenic' },
    ],
  },
  {
    id: 'age',
    step: 6,
    field: 'agePreference',
    title: 'What age pet are you looking for?',
    type: 'single',
    options: [
      { value: 'baby', label: 'Baby', description: 'Puppy or kitten' },
      { value: 'young', label: 'Young', description: '1-3 years' },
      { value: 'adult', label: 'Adult', description: '3-7 years' },
      { value: 'senior', label: 'Senior', description: '7+ years' },
      { value: 'any', label: 'Any age', description: "I'm open" },
    ],
  },
  {
    id: 'size',
    step: 7,
    field: 'sizePreference',
    title: 'What size pet do you prefer?',
    type: 'single',
    options: [
      { value: 'small', label: 'Small', description: 'Under 25 lbs' },
      { value: 'medium', label: 'Medium', description: '25-50 lbs' },
      { value: 'large', label: 'Large', description: '50+ lbs' },
      { value: 'any', label: 'Any size', description: "I'm open" },
    ],
  },
  {
    id: 'household',
    step: 8,
    field: 'household',
    title: 'Who lives in your household?',
    subtitle: 'Select all that apply',
    type: 'multi',
    options: [
      { value: 'adults_only', label: 'Adults only' },
      { value: 'young_kids', label: 'Young children (under 10)' },
      { value: 'older_kids', label: 'Older children (10+)' },
      { value: 'other_dogs', label: 'Other dogs' },
      { value: 'other_cats', label: 'Other cats' },
    ],
  },
  {
    id: 'temperament',
    step: 9,
    field: 'temperamentStyle',
    title: "What's your ideal pet personality?",
    type: 'single',
    options: [
      { value: 'cuddly_affectionate', label: 'Cuddly & affectionate', description: 'A lap companion' },
      { value: 'playful_energetic', label: 'Playful & energetic', description: 'Always ready for fun' },
      { value: 'calm_easygoing', label: 'Calm & easygoing', description: 'Relaxed and gentle' },
      { value: 'independent_low_maintenance', label: 'Independent & low-maintenance', description: 'Happy on their own' },
    ],
  },
  {
    id: 'noise',
    step: 10,
    field: 'noiseTolerance',
    title: 'How do you feel about barking or vocalizing?',
    type: 'single',
    options: [
      { value: 'fine_with_noise', label: 'Barking/vocalizing is fine' },
      { value: 'prefer_quiet', label: 'Prefer a quieter pet', description: 'Apartment or noise-sensitive' },
    ],
  },
  {
    id: 'breed-notes',
    step: 11,
    field: 'breedNotes',
    title: 'Any breed preferences or notes?',
    subtitle: 'Optional — mention specific breeds, traits, or anything else',
    type: 'text',
    placeholder: 'e.g. "Love Golden Retrievers" or "No shedding please"',
    validation: {
      required: false,
      maxLength: 500,
    },
    conditional: {
      field: 'petType',
      values: ['dog', 'either'],
    },
  },
];

export const TOTAL_STEPS = QUESTIONNAIRE.length;

export const DEFAULT_SEARCH_RADIUS = 25;

export const SEARCH_RADIUS_MIN = 10;
export const SEARCH_RADIUS_MAX = 100;
export const SEARCH_RADIUS_STEP = 5;
