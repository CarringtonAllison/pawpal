import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useSessionStore } from '../store/sessionStore.js';

export function HomePage() {
  const navigate = useNavigate();
  const { setSessionId, isCreating, setIsCreating, createError, setCreateError, reset } =
    useSessionStore();
  const [retryCount] = useState(0);

  const handleStart = async () => {
    setIsCreating(true);
    setCreateError(null);

    try {
      reset();
      const { id } = await api.createSession();
      setSessionId(id);
      navigate(`/quiz/${id}`);
    } catch (err) {
      setCreateError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-5xl font-bold text-teal-800 mb-4">
          PawPal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Find your perfect furry companion. Answer a few questions and we'll match you
          with dogs and cats available at shelters and breeders near you.
        </p>

        <button
          onClick={handleStart}
          disabled={isCreating}
          className="bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white font-semibold py-4 px-8 rounded-xl text-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating session...
            </span>
          ) : (
            'Find Your Perfect Pet'
          )}
        </button>

        {createError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {createError}
            <button
              onClick={handleStart}
              className="ml-2 underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
