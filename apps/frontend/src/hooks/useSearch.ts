import { useState, useEffect, useMemo } from 'react';
import type { EnrichedPet } from '@pawpal/shared';
import { useSessionStore } from '../store/sessionStore.js';
import { api } from '../api/client.js';

export type SortOption = 'best_match' | 'nearest' | 'youngest' | 'oldest' | 'recent';

export interface FilterState {
  petType: 'dog' | 'cat' | 'either';
  ageGroups: string[];
  sizeGroups: string[];
  genders: string[];
  listingTypes: string[];
  minScore: number;
  favoritesOnly: boolean;
  goodWithKids: boolean;
  goodWithDogs: boolean;
  goodWithCats: boolean;
}

const AGE_ORDER: Record<string, number> = { baby: 0, young: 1, adult: 2, senior: 3 };

export const DEFAULT_FILTERS: FilterState = {
  petType: 'either',
  ageGroups: ['baby', 'young', 'adult', 'senior'],
  sizeGroups: ['small', 'medium', 'large', 'xlarge'],
  genders: ['male', 'female', 'unknown'],
  listingTypes: ['rescue', 'foster', 'breeder'],
  minScore: 0,
  favoritesOnly: false,
  goodWithKids: false,
  goodWithDogs: false,
  goodWithCats: false,
};

export function useSearch(sessionId: string | undefined) {
  const { results, setResults, favorites } = useSessionStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>('best_match');
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const perPage = 12;

  useEffect(() => {
    if (!sessionId) return;
    if (results.length > 0) {
      setIsLoading(false);
      return;
    }

    api.getResults(sessionId)
      .then((data) => {
        setResults(data.results);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load results');
        setIsLoading(false);
      });
  }, [sessionId, results.length, setResults]);

  const filtered = useMemo(() => {
    let pets = results;

    if (filters.petType !== 'either') {
      pets = pets.filter((p) => p.species === filters.petType);
    }
    pets = pets.filter((p) => filters.ageGroups.includes(p.age));
    pets = pets.filter((p) => filters.sizeGroups.includes(p.size));
    pets = pets.filter((p) => filters.genders.includes(p.gender));
    pets = pets.filter((p) => filters.listingTypes.includes(p.listingType));
    pets = pets.filter((p) => p.matchScore >= filters.minScore);

    if (filters.favoritesOnly) {
      pets = pets.filter((p) => favorites.includes(p.id));
    }
    if (filters.goodWithKids) {
      pets = pets.filter((p) => p.shelterTraits.environment.children === true);
    }
    if (filters.goodWithDogs) {
      pets = pets.filter((p) => p.shelterTraits.environment.dogs === true);
    }
    if (filters.goodWithCats) {
      pets = pets.filter((p) => p.shelterTraits.environment.cats === true);
    }

    return pets;
  }, [results, filters, favorites]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    switch (sort) {
      case 'best_match':
        return copy.sort((a, b) => b.matchScore - a.matchScore);
      case 'nearest':
        return copy.sort((a, b) => a.shelter.distanceMiles - b.shelter.distanceMiles);
      case 'youngest':
        return copy.sort((a, b) => (AGE_ORDER[a.age] ?? 2) - (AGE_ORDER[b.age] ?? 2));
      case 'oldest':
        return copy.sort((a, b) => (AGE_ORDER[b.age] ?? 2) - (AGE_ORDER[a.age] ?? 2));
      case 'recent':
        return copy.sort((a, b) => {
          const aDate = a.listedAt ? new Date(a.listedAt).getTime() : 0;
          const bDate = b.listedAt ? new Date(b.listedAt).getTime() : 0;
          return bDate - aDate;
        });
      default:
        return copy;
    }
  }, [filtered, sort]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paginated = sorted.slice((page - 1) * perPage, page * perPage);

  const updateFilter = (updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  };

  const changeSort = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  return {
    pets: paginated,
    allFiltered: sorted,
    totalCount: sorted.length,
    isLoading,
    error,
    sort,
    changeSort,
    filters,
    updateFilter,
    resetFilters,
    page,
    setPage,
    totalPages,
    perPage,
  };
}
