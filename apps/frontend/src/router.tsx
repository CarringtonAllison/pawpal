import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { LoadingScreen } from './pages/LoadingScreen.js';
import { WizardShell } from './components/wizard/WizardShell.js';
import { useSessionStatus } from './hooks/useSessionStatus.js';

function RequireSession({
  requiredStatus,
  children,
}: {
  requiredStatus: 'questionnaire' | 'searching' | 'complete';
  children: React.ReactNode;
}) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { status, isLoading, error } = useSessionStatus(sessionId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !status) {
    return <Navigate to="/" replace />;
  }

  // Redirect based on actual session status
  if (requiredStatus === 'searching' && (status === 'complete' || status === 'partial')) {
    return <Navigate to={`/results/${sessionId}`} replace />;
  }
  if (requiredStatus === 'complete' && status === 'questionnaire') {
    return <Navigate to={`/quiz/${sessionId}`} replace />;
  }

  return <>{children}</>;
}

// Results page placeholder — will be built in Phase 5
function ResultsPlaceholder() {
  const { sessionId } = useParams<{ sessionId: string }>();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Results</h2>
      <p className="text-gray-500">Results page coming in Phase 5</p>
      <p className="text-sm text-gray-400 mt-2">Session: {sessionId}</p>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/quiz/:sessionId',
    element: (
      <RequireSession requiredStatus="questionnaire">
        <WizardShell />
      </RequireSession>
    ),
  },
  {
    path: '/quiz/:sessionId/loading',
    element: (
      <RequireSession requiredStatus="searching">
        <LoadingScreen />
      </RequireSession>
    ),
  },
  {
    path: '/results/:sessionId',
    element: (
      <RequireSession requiredStatus="complete">
        <ResultsPlaceholder />
      </RequireSession>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
