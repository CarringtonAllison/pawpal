import type { EnrichedPet } from '@pawpal/shared';
import { ListingTypeBadge } from './ListingTypeBadge.js';
import { MatchBadge } from './MatchBadge.js';
import { FavoriteButton } from './FavoriteButton.js';

interface PetCardProps {
  pet: EnrichedPet;
  onClick: () => void;
}

export function PetCard({ pet, onClick }: PetCardProps) {
  const photoUrl = pet.photos[0] ?? pet.breedPhotos[0] ?? null;
  const tags = pet.shelterTraits.tags.slice(0, 3);

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 cursor-pointer"
    >
      {/* Photo area */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={`Photo of ${pet.name}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2">
          <FavoriteButton petId={pet.id} />
        </div>
        <div className="absolute top-2 right-2">
          <ListingTypeBadge listingType={pet.listingType} size="sm" />
        </div>
      </div>

      {/* Info area */}
      <div className="p-4">
        <div className="flex items-baseline gap-1.5 mb-1">
          <h3 className="font-semibold text-gray-900 truncate">{pet.name}</h3>
          <span className="text-sm text-gray-500">
            {pet.age === 'baby' ? 'Baby' : pet.age === 'young' ? 'Young' : pet.age === 'senior' ? 'Senior' : 'Adult'}
          </span>
          <span className="text-sm">{pet.species === 'dog' ? '🐶' : '🐱'}</span>
        </div>

        <p className="text-sm text-gray-600 mb-1">{pet.breedPrimary}</p>
        <p className="text-xs text-gray-500 mb-3">
          📍 {pet.shelter.distanceMiles.toFixed(1)} miles away
        </p>

        <MatchBadge score={pet.matchScore} />

        {pet.matchExplanation && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
            "{pet.matchExplanation}"
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
