import type { ListingType } from '@pawpal/shared';

interface ListingTypeBadgeProps {
  listingType: ListingType;
  size?: 'sm' | 'md';
}

const BADGE_CONFIG: Record<ListingType, { label: string; classes: string }> = {
  rescue: {
    label: 'Rescue / Adopt',
    classes: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  foster: {
    label: 'Foster',
    classes: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  breeder: {
    label: 'Breeder',
    classes: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
};

export function ListingTypeBadge({ listingType, size = 'sm' }: ListingTypeBadgeProps) {
  const config = BADGE_CONFIG[listingType];
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      role="status"
      aria-label={`Listing type: ${config.label}`}
      className={`inline-flex items-center rounded-full border font-medium ${config.classes} ${sizeClasses}`}
    >
      {config.label}
    </span>
  );
}
