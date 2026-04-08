import { createBrowserRouter, Navigate, useParams } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';
import { LoadingScreen } from './pages/LoadingScreen.js';
import { ResultsPage } from './pages/ResultsPage.js';
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
        <ResultsPage />
      </RequireSession>
    ),
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
