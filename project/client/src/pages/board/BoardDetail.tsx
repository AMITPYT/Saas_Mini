import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { boardService, Board, List, Card, cardService } from '../../services/board.service';
import { getEntityId } from '../../lib/entity';
import { useResolvedEntityId, useResolvedWorkspaceId } from '../../hooks/useResolvedIds';
import { PlusIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';

export const BoardDetail: React.FC = () => {
  const { boardId: routeBoardId } = useParams<{ workspaceId: string; boardId: string }>();
  const [board, setBoard] = useState<Board | null>(null);
  const workspaceId = useResolvedWorkspaceId();
  const boardId = useResolvedEntityId(routeBoardId, board);
  const [lists, setLists] = useState<List[]>([]);
  const [cards, setCards] = useState<Record<string, Card[]>>({});
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);
  const [showAddList, setShowAddList] = useState(false);

  useEffect(() => {
    if (boardId) loadBoard();
  }, [boardId]);

  const loadBoard = async () => {
    setLoading(true);
    try {
      const response = await boardService.getById(boardId!);
      setBoard(response.data.data.board);
      setLists(response.data.data.lists || []);

      // Load cards for each list
      const cardsByList: Record<string, Card[]> = {};
      await Promise.all(
        (response.data.data.lists || []).map(async (list: List) => {
          const listId = getEntityId(list);
          const cardsRes = await cardService.getByList(listId);
          cardsByList[listId] = cardsRes.data.data.cards || [];
        })
      );
      setCards(cardsByList);
    } catch (error) {
      console.error('Failed to load board:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    setAddingList(true);
    try {
      const response = await boardService.createList(boardId!, { name: newListName });
      setLists([...lists, response.data.data.list]);
      setCards({ ...cards, [getEntityId(response.data.data.list)]: [] });
      setNewListName('');
      setShowAddList(false);
    } catch (error) {
      console.error('Failed to add list:', error);
    } finally {
      setAddingList(false);
    }
  };

  const handleAddCard = async (listId: string, title: string) => {
    try {
      const response = await cardService.create({ title, listId });
      setCards({
        ...cards,
        [listId]: [...(cards[listId] || []), response.data.data.card],
      });
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Board not found</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-10rem)]">
      {/* Board header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{board.name}</h1>
      </div>

      {/* Board content */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {lists.map((list) => (
          <ListColumn
            key={list._id}
            list={list}
            cards={cards[list._id] || []}
            onAddCard={(title) => handleAddCard(list._id, title)}
          />
        ))}

        {/* Add list */}
        <div className="flex-shrink-0 w-72">
          {showAddList ? (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list title..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAddList()}
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleAddList}
                  disabled={addingList}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 disabled:opacity-50"
                >
                  Add List
                </button>
                <button
                  onClick={() => setShowAddList(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddList(true)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <PlusIcon className="w-5 h-5" />
              Add another list
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ListColumn: React.FC<{
  list: List;
  cards: Card[];
  onAddCard: (title: string) => void;
}> = ({ list, cards, onAddCard }) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const handleAdd = () => {
    if (!newCardTitle.trim()) return;
    onAddCard(newCardTitle);
    setNewCardTitle('');
    setShowAddCard(false);
  };

  return (
    <div className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col max-h-full">
      {/* List header */}
      <div className="flex items-center justify-between p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">{list.name}</h3>
        <button className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
          <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {cards.map((card) => (
          <div
            key={card._id}
            className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm hover:shadow cursor-pointer"
          >
            {card.labels && card.labels.length > 0 && (
              <div className="flex gap-1 mb-2">
                {card.labels.map((label, i) => (
                  <span
                    key={i}
                    className="w-8 h-1.5 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-gray-900 dark:text-white">{card.title}</p>
            {(card.dueDate || card.comments?.length > 0 || card.checklists?.length > 0) && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                {card.dueDate && (
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                    {new Date(card.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add card */}
      <div className="p-2">
        {showAddCard ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              className="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-white resize-none focus:ring-0"
              rows={2}
              autoFocus
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleAdd}
                className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
              >
                Add Card
              </button>
              <button
                onClick={() => setShowAddCard(false)}
                className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddCard(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <PlusIcon className="w-4 h-4" />
            Add a card
          </button>
        )}
      </div>
    </div>
  );
};
