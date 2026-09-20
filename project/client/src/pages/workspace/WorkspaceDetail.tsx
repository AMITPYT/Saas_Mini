import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { workspaceService, Workspace, WorkspaceStats } from '../../services/workspace.service';
import { boardService, Board } from '../../services/board.service';
import { channelService, Channel } from '../../services/channel.service';
import { pageService, Page } from '../../services/page.service';
import {
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
  UsersIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export const WorkspaceDetail: React.FC = () => {
  const workspaceId = useResolvedWorkspaceId();
  const { currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData();
    }
  }, [workspaceId]);

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const [workspaceRes, statsRes, boardsRes, channelsRes, pagesRes] = await Promise.allSettled([
        workspaceService.getById(workspaceId!),
        workspaceService.getStats(workspaceId!),
        boardService.getByWorkspace(workspaceId!),
        channelService.getByWorkspace(workspaceId!),
        pageService.getByWorkspace(workspaceId!),
      ]);

      if (workspaceRes.status === 'fulfilled') {
        setCurrentWorkspace(workspaceRes.value.data.data.workspace);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.data.stats);
      }
      if (boardsRes.status === 'fulfilled') {
        setBoards(boardsRes.value.data.data.boards || []);
      }
      if (channelsRes.status === 'fulfilled') {
        setChannels(channelsRes.value.data.data.channels || []);
      }
      if (pagesRes.status === 'fulfilled') {
        setPages(pagesRes.value.data.data.pages || []);
      }
    } catch (error) {
      console.error('Failed to load workspace data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Workspace not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-3xl font-bold">
            {currentWorkspace.icon || currentWorkspace.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentWorkspace.name}
            </h1>
            {currentWorkspace.description && (
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                {currentWorkspace.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/workspace/${workspaceId}/settings`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalMembers || currentWorkspace.members?.length || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <ViewColumnsIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalBoards || boards.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Boards</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalChannels || channels.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Channels</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalPages || pages.length}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick access sections */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Boards */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ViewColumnsIcon className="w-5 h-5 text-blue-500" />
              Boards
            </h2>
            <Link
              to={`/workspace/${workspaceId}/boards`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="p-4">
            {boards.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No boards yet
                </p>
                <Link
                  to={`/workspace/${workspaceId}/boards`}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create board
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {boards.slice(0, 5).map((board) => (
                  <Link
                    key={getEntityId(board)}
                    to={`/workspace/${workspaceId}/board/${getEntityId(board)}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {board.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Channels */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ChatBubbleLeftRightIcon className="w-5 h-5 text-green-500" />
              Channels
            </h2>
            <Link
              to={`/workspace/${workspaceId}/channels`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="p-4">
            {channels.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No channels yet
                </p>
                <Link
                  to={`/workspace/${workspaceId}/channels`}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create channel
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {channels.slice(0, 5).map((channel) => (
                  <Link
                    key={getEntityId(channel)}
                    to={`/workspace/${workspaceId}/channel/${getEntityId(channel)}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      # {channel.name}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pages */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-purple-500" />
              Pages
            </h2>
            <Link
              to={`/workspace/${workspaceId}/pages`}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          <div className="p-4">
            {pages.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  No pages yet
                </p>
                <Link
                  to={`/workspace/${workspaceId}/pages`}
                  className="inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  <PlusIcon className="w-4 h-4" />
                  Create page
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {pages.slice(0, 5).map((page) => (
                  <Link
                    key={getEntityId(page)}
                    to={`/workspace/${workspaceId}/page/${getEntityId(page)}`}
                    className="block p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">
                      {page.icon || '📄'} {page.title || 'Untitled'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
