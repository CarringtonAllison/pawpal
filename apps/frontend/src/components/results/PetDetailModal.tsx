import { useEffect, useRef } from 'react';
import type { EnrichedPet } from '@pawpal/shared';
import { ListingTypeBadge } from './ListingTypeBadge.js';
import { MatchBadge } from './MatchBadge.js';
import { FavoriteButton } from './FavoriteButton.js';
import { ShareButton } from './ShareButton.js';

interface PetDetailModalProps {
  pet: EnrichedPet;
  onClose: () => void;
}

export function PetDetailModal({ pet, onClose }: PetDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  const photos = pet.photos.length > 0 ? pet.photos : pet.breedPhotos;
  const tags = pet.shelterTraits.tags;
  const env = pet.shelterTraits.environment;
  const attrs = pet.shelterTraits.attributes;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-sm"
          aria-label="Close"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Photo */}
        {photos.length > 0 && (
          <div className="aspect-video bg-gray-100 rounded-t-2xl overflow-hidden">
            <img
              src={photos[0]}
              alt={`Photo of ${pet.name}`}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
                <FavoriteButton petId={pet.id} />
              </div>
              <p className="text-gray-600">
                {pet.breedPrimary} · {pet.gender === 'male' ? 'Male' : pet.gender === 'female' ? 'Female' : 'Unknown'} · {pet.age}
              </p>
              <p className="text-sm text-gray-500">{pet.size} · {pet.species === 'dog' ? 'Dog' : 'Cat'}</p>
              <div className="flex items-center gap-2 mt-2">
                <ListingTypeBadge listingType={pet.listingType} size="md" />
                <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
                  via {pet.source === 'petfinder' ? 'Petfinder' : 'RescueGroups'}
                </span>
              </div>
            </div>
            <ShareButton
              url={pet.sourceUrl}
              title={`Check out ${pet.name}!`}
              text={`${pet.name} — a ${pet.breedPrimary} available at ${pet.shelter.name}`}
            />
          </div>

          <div className="mb-4">
            <MatchBadge score={pet.matchScore} />
          </div>

          {/* Description */}
          {pet.description && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">About {pet.name}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{pet.description}</p>
            </div>
          )}

          {/* Match explanation */}
          {pet.matchExplanation && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Why {pet.name} is a great match</h3>
              <p className="text-sm text-gray-600 italic">"{pet.matchExplanation}"</p>
              {pet.strengthLabels.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {pet.strengthLabels.map((label) => (
                    <span key={label} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                      ✅ {label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Shelter-reported traits */}
          {(tags.length > 0 || env.children !== null || env.dogs !== null || env.cats !== null) ? (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-1">Reported by Shelter</h3>
              <p className="text-xs text-gray-500 mb-3">Based on this animal's behavior assessment</p>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {tags.map((tag) => (
                    <span key={tag} className="text-xs px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-sm">
                <CompatRow label="Good with kids" value={env.children} />
                <CompatRow label="Good with dogs" value={env.dogs} />
                <CompatRow label="Good with cats" value={env.cats} />
                <CompatRow label="House trained" value={attrs.house_trained} />
                <CompatRow label="Special needs" value={attrs.special_needs ? true : false} invert />
                <CompatRow label="Shots current" value={attrs.shots_current} />
                <CompatRow label="Spayed/neutered" value={attrs.spayed_neutered} />
              </div>
            </div>
          ) : (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
              This shelter hasn't provided a behavior assessment for {pet.name} yet. Contact them directly for more info.
            </div>
          )}

          {/* Breed traits */}
          {pet.breedTraits ? (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-1">{pet.breedPrimary} — Breed Overview</h3>
              <p className="text-xs text-gray-500 mb-3 italic">
                These are typical traits for this breed. {pet.name}'s actual personality may vary.
              </p>

              <div className="space-y-2">
                <TraitBar label="Energy" value={pet.breedTraits.energyLevel} />
                <TraitBar label="Affection" value={pet.breedTraits.affectionLevel} />
                <TraitBar label="Trainability" value={pet.breedTraits.trainability} />
                <TraitBar label="Barking" value={pet.breedTraits.barkingLevel} />
                <TraitBar label="Shedding" value={pet.breedTraits.sheddingLevel} />
                <TraitBar label="Grooming" value={pet.breedTraits.groomingNeedsLevel} />
              </div>
            </div>
          ) : (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg text-sm text-gray-500 italic">
              {pet.name} is a mixed breed — personality traits shown above are based on shelter observations only.
            </div>
          )}

          {/* Shelter info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-2">Where to Find {pet.name}</h3>
            <p className="font-medium text-gray-700">{pet.shelter.name}</p>
            {pet.shelter.address && (
              <p className="text-sm text-gray-600">{pet.shelter.address}</p>
            )}
            <p className="text-sm text-gray-600">
              {pet.shelter.city}, {pet.shelter.state} {pet.shelter.zip}
            </p>
            {pet.shelter.phone && (
              <p className="text-sm text-gray-600 mt-1">📞 {pet.shelter.phone}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              📍 {pet.shelter.distanceMiles.toFixed(1)} miles from you
            </p>

            <div className="flex gap-3 mt-4">
              {pet.sourceUrl && (
                <a
                  href={pet.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  View on {pet.source === 'petfinder' ? 'Petfinder' : 'RescueGroups'} ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompatRow({ label, value, invert }: { label: string; value: boolean | null; invert?: boolean }) {
  const displayValue = invert ? (value === true ? false : value === false ? true : null) : value;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base">
        {displayValue === true ? '✅' : displayValue === false ? '❌' : '❓'}
      </span>
      <span className="text-gray-700">{label}</span>
    </div>
  );
}

function TraitBar({ label, value }: { label: string; value: number }) {
  const labels = ['', 'Very Low', 'Low', 'Moderate', 'High', 'Very High'];
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-teal-500 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-16">{labels[value]} ({value}/5)</span>
    </div>
  );
}
