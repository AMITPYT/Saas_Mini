import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './ProtectedRoute';

// Layouts
import { DashboardLayout } from '../layouts/DashboardLayout';
import { AuthLayout } from '../layouts/AuthLayout';

// Auth pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { ResetPassword } from '../pages/auth/ResetPassword';

// Dashboard pages
import { Dashboard } from '../pages/dashboard/Dashboard';
import { WorkspaceList } from '../pages/workspace/WorkspaceList';
import { WorkspaceDetail } from '../pages/workspace/WorkspaceDetail';
import { WorkspaceSettings } from '../pages/workspace/WorkspaceSettings';

// Board pages
import { BoardList } from '../pages/board/BoardList';
import { BoardDetail } from '../pages/board/BoardDetail';

// Channel pages
import { ChannelList } from '../pages/channel/ChannelList';
import { ChannelDetail } from '../pages/channel/ChannelDetail';

// Page pages
import { PageList } from '../pages/page/PageList';
import { PageDetail } from '../pages/page/PageDetail';

// Settings pages
import { ProfileSettings } from '../pages/settings/ProfileSettings';

// Error pages
import { NotFound } from '../pages/errors/NotFound';

export const router = createBrowserRouter([
  // Public routes (auth)
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <Login /> },
          { path: '/register', element: <Register /> },
          { path: '/forgot-password', element: <ForgotPassword /> },
          { path: '/reset-password/:token', element: <ResetPassword /> },
        ],
      },
    ],
  },

  // Protected routes (dashboard)
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Default redirect
          { index: true, element: <Navigate to="/dashboard" replace /> },

          // Dashboard
          { path: '/dashboard', element: <Dashboard /> },

          // Workspaces
          { path: '/workspaces', element: <WorkspaceList /> },
          { path: '/workspace/:workspaceId', element: <WorkspaceDetail /> },
          { path: '/workspace/:workspaceId/settings', element: <WorkspaceSettings /> },

          // Boards
          { path: '/workspace/:workspaceId/boards', element: <BoardList /> },
          { path: '/workspace/:workspaceId/board/:boardId', element: <BoardDetail /> },

          // Channels
          { path: '/workspace/:workspaceId/channels', element: <ChannelList /> },
          { path: '/workspace/:workspaceId/channel/:channelId', element: <ChannelDetail /> },

          // Pages
          { path: '/workspace/:workspaceId/pages', element: <PageList /> },
          { path: '/workspace/:workspaceId/page/:pageId', element: <PageDetail /> },

          // Settings
          { path: '/settings/profile', element: <ProfileSettings /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFound /> },
]);
