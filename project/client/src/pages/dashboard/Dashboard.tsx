import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { getEntityId } from '../../lib/entity';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { workspaceService, Workspace } from '../../services/workspace.service';
import {
  FolderIcon,
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { workspaces, setWorkspaces, setLoading, isLoading } = useWorkspaceStore();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    try {
      const response = await workspaceService.getAll();
      setWorkspaces(response.data.data.workspaces || []);
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here's what's happening in your workspaces
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/workspaces"
          className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40">
              <FolderIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Workspaces
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {workspaces.length}
              </p>
            </div>
          </div>
        </Link>

        <div className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              <ViewColumnsIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Boards
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
              <ChatBubbleLeftRightIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Channels
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                -
              </p>
            </div>
          </div>
        </div>

        <div className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                Pages
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                -
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Workspaces section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Workspaces
          </h2>
          <Link
            to="/workspaces"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
          >
            View all
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No workspaces
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new workspace.
            </p>
            <div className="mt-6">
              <Link
                to="/workspaces"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-5 h-5" />
                New Workspace
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {workspaces.slice(0, 6).map((workspace) => {
              const workspaceId = getEntityId(workspace);
              return (
              <Link
                key={workspaceId}
                to={`/workspace/${workspaceId}`}
                className="group relative rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xl font-bold">
                    {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {workspace.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {workspace.members?.length || 0} members
                    </p>
                  </div>
                </div>
                {workspace.description && (
                  <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {workspace.description}
                  </p>
                )}
              </Link>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
