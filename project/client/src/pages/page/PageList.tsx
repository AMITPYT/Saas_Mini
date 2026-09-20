import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pageService, Page } from '../../services/page.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { PlusIcon, DocumentTextIcon, ChevronRightIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export const PageList: React.FC = () => {
  const workspaceId = useResolvedWorkspaceId({ redirectSuffix: '/pages' });
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (workspaceId) loadPages();
  }, [workspaceId]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await pageService.getByWorkspace(workspaceId!);
      setPages(response.data.data.pages || []);
    } catch (error) {
      console.error('Failed to load pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const response = await pageService.create({ workspaceId: workspaceId! });
      setPages([...pages, response.data.data.page]);
    } catch (error) {
      console.error('Failed to create page:', error);
    } finally {
      setCreating(false);
    }
  };

  const favoritePages = pages.filter((p) => p.isFavorite);
  const rootPages = pages.filter((p) => !p.parentId);

  const renderPageTree = (page: Page, depth: number = 0) => {
    const pageId = getEntityId(page);
    const children = pages.filter((p) => p.parentId === pageId);

    return (
      <div key={pageId}>
        <Link
          to={`/workspace/${workspaceId}/page/${pageId}`}
          className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 group"
          style={{ paddingLeft: `${16 + depth * 24}px` }}
        >
          {children.length > 0 && (
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
          )}
          <span className="text-lg">{page.icon || '📄'}</span>
          <span className="flex-1 text-gray-900 dark:text-white truncate">
            {page.title || 'Untitled'}
          </span>
          {page.isFavorite && (
            <StarIconSolid className="w-4 h-4 text-yellow-400" />
          )}
        </Link>
        {children.map((child) => renderPageTree(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pages</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create and organize your documents
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <PlusIcon className="w-5 h-5" />
          {creating ? 'Creating...' : 'New Page'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pages</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first page to start writing.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              <PlusIcon className="w-5 h-5" />
              New Page
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {favoritePages.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <StarIcon className="w-4 h-4" />
                Favorites
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {favoritePages.map((page) => {
                  const pageId = getEntityId(page);
                  return (
                  <Link
                    key={pageId}
                    to={`/workspace/${workspaceId}/page/${pageId}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                  >
                    <span className="text-lg">{page.icon || '📄'}</span>
                    <span className="flex-1 text-gray-900 dark:text-white">
                      {page.title || 'Untitled'}
                    </span>
                    <StarIconSolid className="w-4 h-4 text-yellow-400" />
                  </Link>
                );
                })}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              All Pages
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {rootPages.map((page) => renderPageTree(page))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
