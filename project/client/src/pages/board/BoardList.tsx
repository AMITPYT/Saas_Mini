import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { boardService, Board } from '../../services/board.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { PlusIcon, ViewColumnsIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export const BoardList: React.FC = () => {
  const workspaceId = useResolvedWorkspaceId({ redirectSuffix: '/boards' });
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoard, setNewBoard] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (workspaceId) loadBoards();
  }, [workspaceId]);

  const loadBoards = async () => {
    setLoading(true);
    try {
      const response = await boardService.getByWorkspace(workspaceId!);
      setBoards(response.data.data.boards || []);
    } catch (error) {
      console.error('Failed to load boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoard.name.trim()) return;

    setCreating(true);
    try {
      const response = await boardService.create({
        ...newBoard,
        workspaceId: workspaceId!,
      });
      setBoards([...boards, response.data.data.board]);
      setShowCreateModal(false);
      setNewBoard({ name: '', description: '' });
    } catch (error) {
      console.error('Failed to create board:', error);
    } finally {
      setCreating(false);
    }
  };

  const toggleStar = async (board: Board) => {
    try {
      const boardId = getEntityId(board);
      await boardService.update(boardId, { isStarred: !board.isStarred });
      setBoards(boards.map((b) =>
        getEntityId(b) === boardId ? { ...b, isStarred: !b.isStarred } : b
      ));
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  };

  const starredBoards = boards.filter((b) => b.isStarred);
  const otherBoards = boards.filter((b) => !b.isStarred);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Boards</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Organize your work with Kanban boards
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
        >
          <PlusIcon className="w-5 h-5" />
          New Board
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : boards.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ViewColumnsIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No boards</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create your first board to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700"
            >
              <PlusIcon className="w-5 h-5" />
              New Board
            </button>
          </div>
        </div>
      ) : (
        <>
          {starredBoards.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                Starred
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {starredBoards.map((board) => (
                  <BoardCard key={getEntityId(board)} board={board} workspaceId={workspaceId!} onToggleStar={toggleStar} />
                ))}
              </div>
            </div>
          )}

          <div>
            {starredBoards.length > 0 && (
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
                All Boards
              </h2>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {otherBoards.map((board) => (
                <BoardCard key={getEntityId(board)} board={board} workspaceId={workspaceId!} onToggleStar={toggleStar} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl">
            <form onSubmit={handleCreate}>
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Board</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={newBoard.name}
                      onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Board name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={newBoard.description}
                      onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">Cancel</button>
                <button type="submit" disabled={creating} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const BoardCard: React.FC<{ board: Board; workspaceId: string; onToggleStar: (board: Board) => void }> = ({
  board,
  workspaceId,
  onToggleStar,
}) => {
  const bgStyle = board.background?.type === 'color'
    ? { backgroundColor: board.background.value }
    : board.background?.type === 'gradient'
    ? { background: board.background.value }
    : { backgroundColor: '#3b82f6' };

  return (
    <div className="group relative rounded-lg overflow-hidden h-32">
      <Link
        to={`/workspace/${workspaceId}/board/${getEntityId(board)}`}
        className="absolute inset-0 p-4 flex flex-col justify-between text-white"
        style={bgStyle}
      >
        <div className="flex items-start justify-between">
          <h3 className="font-semibold truncate pr-8">{board.name}</h3>
        </div>
        {board.description && (
          <p className="text-sm opacity-80 line-clamp-2">{board.description}</p>
        )}
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onToggleStar(board);
        }}
        className="absolute top-3 right-3 p-1 rounded hover:bg-white/20"
      >
        {board.isStarred ? (
          <StarIconSolid className="w-5 h-5 text-yellow-400" />
        ) : (
          <StarIcon className="w-5 h-5 text-white/70 group-hover:text-white" />
        )}
      </button>
    </div>
  );
};
