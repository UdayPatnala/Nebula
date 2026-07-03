import { createBrowserRouter, Navigate } from 'react-router-dom';

// Import providers/hooks
import { useAuth } from '../providers';

// Import layout
import AppShell from '../layouts/AppShell';

// Import pages
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import ProjectsPage from '../pages/ProjectsPage';
import UploadPage from '../pages/UploadPage';
import AIProcessingPage from '../pages/AIProcessingPage';
import AIReviewPage from '../pages/AIReviewPage';
import GalleryBuilderPage from '../pages/GalleryBuilderPage';
import GalleryViewerPage from '../pages/GalleryViewerPage';
import CreditsPage from '../pages/CreditsPage';
import SettingsPage from '../pages/SettingsPage';
import HelpPage from '../pages/HelpPage';
import AdminPage from '../pages/AdminPage';

interface GuardProps {
  children: React.ReactNode;
}

// Protected Route Guard
function ProtectedRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-secondary)',
        fontFamily: 'var(--font-sans)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route Guard
function AdminRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-base)'
      }}>
        <p>Checking authorization...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'administrator' && user.role !== 'super_administrator') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Guest Route Guard (Redirects to dashboard if already logged in)
function GuestRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  // Public (Guest) Routes
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/features',
    element: <LandingPage />,
  },
  {
    path: '/pricing',
    element: <LandingPage />,
  },
  {
    path: '/faq',
    element: <HelpPage />,
  },
  {
    path: '/gallery/:shareId',
    element: <GalleryViewerPage />,
  },

  // Auth Routes
  {
    path: '/login',
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
  },
  {
    path: '/signup',
    element: (
      <GuestRoute>
        <SignupPage />
      </GuestRoute>
    ),
  },

  // Protected User Space (Renders inside AppShell layout)
  {
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/onboarding',
        element: <OnboardingPage />,
      },
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/projects',
        element: <ProjectsPage />,
      },
      {
        path: '/projects/:projectId',
        element: <AIReviewPage />,
      },
      {
        path: '/projects/:projectId/upload',
        element: <UploadPage />,
      },
      {
        path: '/projects/:projectId/analysis',
        element: <AIProcessingPage />,
      },
      {
        path: '/projects/:projectId/gallery',
        element: <GalleryBuilderPage />,
      },
      {
        path: '/projects/:projectId/preview',
        element: <GalleryViewerPage />,
      },
      {
        path: '/projects/:projectId/publish',
        element: <GalleryBuilderPage />,
      },
      {
        path: '/galleries',
        element: <ProjectsPage />,
      },
      {
        path: '/credits',
        element: <CreditsPage />,
      },
      {
        path: '/settings',
        element: <SettingsPage />,
      },
      {
        path: '/profile',
        element: <SettingsPage />,
      },
      {
        path: '/notifications',
        element: <DashboardPage />,
      },
      {
        path: '/help',
        element: <HelpPage />,
      }
    ],
  },

  // Protected Admin Space (Renders inside AppShell layout)
  {
    element: (
      <AdminRoute>
        <AppShell />
      </AdminRoute>
    ),
    children: [
      {
        path: '/admin',
        element: <AdminPage />,
      },
      {
        path: '/admin/users',
        element: <AdminPage />,
      },
      {
        path: '/admin/analytics',
        element: <AdminPage />,
      },
      {
        path: '/admin/system',
        element: <AdminPage />,
      }
    ],
  },

  // Fallback Catch All
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);
