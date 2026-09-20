import { Link, useLocation } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import {
  HomeIcon,
  FolderIcon,
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Workspaces', href: '/workspaces', icon: FolderIcon },
];

const workspaceNavigation = (workspaceId: string) => [
  { name: 'Overview', href: `/workspace/${workspaceId}`, icon: HomeIcon },
  { name: 'Boards', href: `/workspace/${workspaceId}/boards`, icon: ViewColumnsIcon },
  { name: 'Channels', href: `/workspace/${workspaceId}/channels`, icon: ChatBubbleLeftRightIcon },
  { name: 'Pages', href: `/workspace/${workspaceId}/pages`, icon: DocumentTextIcon },
  { name: 'Settings', href: `/workspace/${workspaceId}/settings`, icon: Cog6ToothIcon },
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const workspaceId = useResolvedWorkspaceId();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, toggleSidebarCollapse } = useUIStore();
  const { workspaces, currentWorkspace } = useWorkspaceStore();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Logo and close button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                SaaS App
              </span>
            </Link>
          )}

          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          )}

          {/* Mobile close button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main navigation */}
          <div className="px-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.name}</span>}
              </Link>
            ))}
          </div>

          {/* Workspace navigation (when in workspace) */}
          {workspaceId && (
            <div className="mt-6">
              {!sidebarCollapsed && (
                <div className="px-4 mb-2">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {currentWorkspace?.name || 'Workspace'}
                  </h3>
                </div>
              )}
              <div className="px-3 space-y-1">
                {workspaceNavigation(workspaceId).map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      location.pathname === item.href
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Workspaces list */}
          {!workspaceId && workspaces.length > 0 && (
            <div className="mt-6">
              {!sidebarCollapsed && (
                <div className="px-4 mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Workspaces
                  </h3>
                  <Link
                    to="/workspaces"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <PlusIcon className="w-4 h-4 text-gray-500" />
                  </Link>
                </div>
              )}
              <div className="px-3 space-y-1">
                {workspaces.slice(0, 5).map((workspace) => {
                  const id = getEntityId(workspace);
                  return (
                  <Link
                    key={id}
                    to={`/workspace/${id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${
                      sidebarCollapsed ? 'justify-center' : ''
                    }`}
                    title={sidebarCollapsed ? workspace.name : undefined}
                  >
                    <span className="w-5 h-5 rounded bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 flex-shrink-0">
                      {workspace.icon || workspace.name.charAt(0).toUpperCase()}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{workspace.name}</span>
                    )}
                  </Link>
                );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Collapse toggle */}
        <div className="hidden lg:flex items-center justify-center py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={toggleSidebarCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {sidebarCollapsed ? (
              <ChevronRightIcon className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
      </div>
    </>
  );
};
