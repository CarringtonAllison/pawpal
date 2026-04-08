import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { EnrichedPet } from '@pawpal/shared';
import { useSearch } from '../hooks/useSearch.js';
import { useSessionStore } from '../store/sessionStore.js';
import { PetCard } from '../components/results/PetCard.js';
import { PetDetailModal } from '../components/results/PetDetailModal.js';
import { FilterPanel } from '../components/results/FilterPanel.js';
import { Pagination } from '../components/results/Pagination.js';
import { ShareButton } from '../components/results/ShareButton.js';

export function ResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { favorites } = useSessionStore();
  const search = useSearch(sessionId);
  const [selectedPet, setSelectedPet] = useState<EnrichedPet | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  if (search.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (search.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-600 mb-4">{search.error}</p>
        <button
          onClick={() => navigate('/')}
          className="bg-teal-600 text-white px-6 py-2 rounded-lg"
        >
          Start over
        </button>
      </div>
    );
  }

  const handlePageChange = (newPage: number) => {
    search.setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-teal-700">PawPal</h1>
            <button
              onClick={() => navigate(`/quiz/${sessionId}`)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to quiz
            </button>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton
              url={window.location.href}
              title="My PawPal Results"
              text="Check out the pets I found on PawPal!"
            />
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden px-3 py-1.5 text-sm bg-gray-100 rounded-lg"
            >
              Filters ({search.totalCount})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results count */}
        <p className="text-sm text-gray-500 mb-4">
          {search.totalCount} matches found
        </p>

        <div className="flex gap-6">
          {/* Filter panel — desktop sidebar / mobile overlay */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block`}>
            <FilterPanel
              filters={search.filters}
              onFilterChange={search.updateFilter}
              onReset={search.resetFilters}
              sort={search.sort}
              onSortChange={search.changeSort}
              totalCount={search.totalCount}
              favoritesCount={favorites.length}
            />
          </div>

          {/* Results grid */}
          <div className="flex-1">
            {search.pets.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">No pets match your current filters.</p>
                <button
                  onClick={search.resetFilters}
                  className="text-teal-600 hover:underline"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {search.pets.map((pet) => (
                    <PetCard
                      key={pet.id}
                      pet={pet}
                      onClick={() => setSelectedPet(pet)}
                    />
                  ))}
                </div>

                <Pagination
                  page={search.page}
                  totalPages={search.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pet detail modal */}
      {selectedPet && (
        <PetDetailModal
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}
    </div>
  );
}
