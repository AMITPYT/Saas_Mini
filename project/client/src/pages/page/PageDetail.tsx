import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { pageService, Page } from '../../services/page.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedEntityId, useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { StarIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import debounce from 'lodash.debounce';

export const PageDetail: React.FC = () => {
  const { pageId: routePageId } = useParams<{ workspaceId: string; pageId: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const workspaceId = useResolvedWorkspaceId();
  const pageId = useResolvedEntityId(routePageId, page);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (pageId) loadPage();
  }, [pageId]);

  const loadPage = async () => {
    setLoading(true);
    try {
      const response = await pageService.getById(pageId!);
      const pageData = response.data.data.page;
      setPage(pageData);
      setTitle(pageData.title || '');
      setContent(typeof pageData.content === 'string' ? pageData.content : '');
    } catch (error) {
      console.error('Failed to load page:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveChanges = useCallback(
    debounce(async (updates: Partial<Page>) => {
      const activePageId = pageId || (page ? getEntityId(page) : undefined);
      if (!activePageId) return;
      setSaving(true);
      try {
        const response = await pageService.update(activePageId, updates);
        setPage(response.data.data.page);
      } catch (error) {
        console.error('Failed to save page:', error);
      } finally {
        setSaving(false);
      }
    }, 1000),
    [pageId, page]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    saveChanges({ title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    saveChanges({ content: newContent });
  };

  const toggleFavorite = async () => {
    if (!page) return;
    try {
      const response = await pageService.update(pageId!, { isFavorite: !page.isFavorite });
      setPage(response.data.data.page);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Page not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {saving && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFavorite}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {page.isFavorite ? (
              <StarIconSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>
          <button className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Cover image placeholder */}
      {page.cover && (
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6 overflow-hidden">
          <img src={page.cover} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Icon and title */}
      <div className="mb-8">
        <div className="flex items-start gap-4">
          <button className="text-4xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-2 -ml-2">
            {page.icon || '📄'}
          </button>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="w-full text-4xl font-bold text-gray-900 dark:text-white bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-300 dark:placeholder-gray-600"
        />
      </div>

      {/* Content editor (basic textarea - will be replaced with rich text editor in Phase 6) */}
      <div className="prose dark:prose-invert max-w-none">
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Start writing..."
          className="w-full min-h-[400px] text-gray-700 dark:text-gray-300 bg-transparent border-0 focus:ring-0 p-0 resize-none placeholder-gray-400 dark:placeholder-gray-500"
        />
      </div>

      {/* Page info */}
      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        <p>
          Last edited {new Date(page.updatedAt).toLocaleDateString()} at{' '}
          {new Date(page.updatedAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};
