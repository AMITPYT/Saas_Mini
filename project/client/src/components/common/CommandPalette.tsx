import { Fragment, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dialog, Combobox, Transition } from '@headlessui/react';
import { useUIStore } from '../../store/uiStore';
import { searchService, SearchResult } from '../../services/search.service';
import {
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ViewColumnsIcon,
  ChatBubbleLeftRightIcon,
  RectangleStackIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

const getIconForType = (type: string) => {
  switch (type) {
    case 'page':
      return DocumentTextIcon;
    case 'board':
      return ViewColumnsIcon;
    case 'card':
      return RectangleStackIcon;
    case 'channel':
      return HashtagIcon;
    case 'message':
      return ChatBubbleLeftRightIcon;
    default:
      return DocumentTextIcon;
  }
};

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentItems, setRecentItems] = useState<SearchResult[]>([]);

  // Load recent items
  useEffect(() => {
    if (workspaceId && commandPaletteOpen) {
      searchService.getRecent(workspaceId, 5).then((response) => {
        setRecentItems(response.data.data.results || []);
      });
    }
  }, [workspaceId, commandPaletteOpen]);

  // Search with debounce
  useEffect(() => {
    if (!query || !workspaceId) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchService.quickSearch(workspaceId, query);
        setResults(response.data.data.results || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, workspaceId]);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = useCallback(
    (item: SearchResult) => {
      setCommandPaletteOpen(false);
      setQuery('');

      switch (item.type) {
        case 'page':
          navigate(`/workspace/${item.workspaceId}/page/${item.id}`);
          break;
        case 'board':
          navigate(`/workspace/${item.workspaceId}/board/${item.id}`);
          break;
        case 'channel':
          navigate(`/workspace/${item.workspaceId}/channel/${item.id}`);
          break;
        case 'card':
          // Navigate to board with card modal open
          if (item.parentId) {
            navigate(`/workspace/${item.workspaceId}/board/${item.parentId}?card=${item.id}`);
          }
          break;
        default:
          break;
      }
    },
    [navigate, setCommandPaletteOpen]
  );

  const displayItems = query ? results : recentItems;

  return (
    <Transition.Root show={commandPaletteOpen} as={Fragment} afterLeave={() => setQuery('')}>
      <Dialog
        as="div"
        className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20"
        onClose={() => setCommandPaletteOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-25 dark:bg-gray-900 dark:bg-opacity-50 transition-opacity" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Combobox
            as="div"
            className="mx-auto max-w-2xl transform divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-2xl ring-1 ring-black ring-opacity-5 transition-all"
            onChange={handleSelect}
          >
            <div className="relative">
              <MagnifyingGlassIcon
                className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              <Combobox.Input
                className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                placeholder="Search pages, boards, channels..."
                onChange={(e) => setQuery(e.target.value)}
                value={query}
              />
            </div>

            {loading && (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            )}

            {!loading && displayItems.length > 0 && (
              <Combobox.Options
                static
                className="max-h-80 scroll-py-2 overflow-y-auto py-2"
              >
                {!query && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Recent
                  </div>
                )}
                {displayItems.map((item) => {
                  const Icon = getIconForType(item.type);
                  return (
                    <Combobox.Option
                      key={`${item.type}-${item.id}`}
                      value={item}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-3 ${
                          active ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                        }`
                      }
                    >
                      {({ active }) => (
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-5 w-5 flex-shrink-0 ${
                              active
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-400'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                active
                                  ? 'text-primary-900 dark:text-primary-100'
                                  : 'text-gray-900 dark:text-white'
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.preview && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {item.preview}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 capitalize">
                            {item.type}
                          </span>
                        </div>
                      )}
                    </Combobox.Option>
                  );
                })}
              </Combobox.Options>
            )}

            {!loading && query && displayItems.length === 0 && (
              <div className="px-6 py-14 text-center sm:px-14">
                <MagnifyingGlassIcon
                  className="mx-auto h-6 w-6 text-gray-400"
                  aria-hidden="true"
                />
                <p className="mt-4 text-sm text-gray-900 dark:text-white">
                  No results found for "{query}"
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Try searching for something else
                </p>
              </div>
            )}

            {!workspaceId && (
              <div className="px-6 py-14 text-center sm:px-14">
                <p className="text-sm text-gray-500">
                  Select a workspace to search
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-900/50 px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">
              <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-semibold">
                ↵
              </kbd>
              <span className="mr-4">to select</span>
              <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-semibold">
                ↑
              </kbd>
              <kbd className="mx-1 flex h-5 w-5 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-semibold">
                ↓
              </kbd>
              <span className="mr-4">to navigate</span>
              <kbd className="mx-1 flex h-5 w-8 items-center justify-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-semibold text-xs">
                esc
              </kbd>
              <span>to close</span>
            </div>
          </Combobox>
        </Transition.Child>
      </Dialog>
    </Transition.Root>
  );
};
