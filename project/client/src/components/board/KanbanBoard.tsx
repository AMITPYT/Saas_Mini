import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { KanbanList } from './KanbanList';
import { KanbanCard } from './KanbanCard';
import { Board, List, Card, boardService, cardService } from '../../services/board.service';
import { PlusIcon } from '@heroicons/react/24/outline';

interface KanbanBoardProps {
  board: Board;
  lists: List[];
  cardsByList: Record<string, Card[]>;
  onListsChange: (lists: List[]) => void;
  onCardsChange: (cardsByList: Record<string, Card[]>) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  board,
  lists,
  cardsByList,
  onListsChange,
  onCardsChange,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'list' | 'card' | null>(null);
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addingList, setAddingList] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findListByCardId = (cardId: string): string | null => {
    for (const [listId, cards] of Object.entries(cardsByList)) {
      if (cards.some((card) => card._id === cardId)) {
        return listId;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const id = active.id as string;

    if (lists.some((list) => list._id === id)) {
      setActiveType('list');
    } else {
      setActiveType('card');
    }
    setActiveId(id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over || activeType !== 'card') return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeListId = findListByCardId(activeId);
    let overListId = findListByCardId(overId);

    // If over a list directly
    if (!overListId && lists.some((list) => list._id === overId)) {
      overListId = overId;
    }

    if (!activeListId || !overListId || activeListId === overListId) return;

    // Move card to different list
    const activeCards = [...(cardsByList[activeListId] || [])];
    const overCards = [...(cardsByList[overListId] || [])];

    const activeIndex = activeCards.findIndex((card) => card._id === activeId);
    const overIndex = overCards.findIndex((card) => card._id === overId);

    const [movedCard] = activeCards.splice(activeIndex, 1);

    if (overIndex === -1) {
      // Dropped on empty list
      overCards.push({ ...movedCard, listId: overListId });
    } else {
      overCards.splice(overIndex, 0, { ...movedCard, listId: overListId });
    }

    onCardsChange({
      ...cardsByList,
      [activeListId]: activeCards,
      [overListId]: overCards,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeType === 'list') {
      // Reorder lists
      const oldIndex = lists.findIndex((list) => list._id === activeId);
      const newIndex = lists.findIndex((list) => list._id === overId);

      if (oldIndex !== newIndex) {
        const newLists = arrayMove(lists, oldIndex, newIndex);
        onListsChange(newLists);

        // Persist to server
        try {
          await boardService.reorderLists(
            board._id,
            newLists.map((l) => l._id)
          );
        } catch (error) {
          console.error('Failed to reorder lists:', error);
          onListsChange(lists); // Revert on error
        }
      }
    } else if (activeType === 'card') {
      const activeListId = findListByCardId(activeId);
      let overListId = findListByCardId(overId);

      if (!overListId && lists.some((list) => list._id === overId)) {
        overListId = overId;
      }

      if (!activeListId || !overListId) return;

      const activeCards = cardsByList[activeListId] || [];
      const overCards = cardsByList[overListId] || [];

      const activeIndex = activeCards.findIndex((card) => card._id === activeId);
      const overIndex = overCards.findIndex((card) => card._id === overId);

      // Calculate new position
      let newPosition = 0;
      if (overIndex === -1) {
        newPosition = overCards.length;
      } else if (activeListId === overListId) {
        newPosition = overIndex;
      } else {
        newPosition = overIndex;
      }

      // Persist to server
      try {
        await cardService.move(activeId, {
          listId: overListId,
          position: newPosition,
        });
      } catch (error) {
        console.error('Failed to move card:', error);
        // Could revert here if needed
      }
    }
  };

  const handleAddList = async () => {
    if (!newListName.trim()) return;

    setAddingList(true);
    try {
      const response = await boardService.createList(board._id, { name: newListName });
      const newList = response.data.data.list;
      onListsChange([...lists, newList]);
      onCardsChange({ ...cardsByList, [newList._id]: [] });
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
      const newCard = response.data.data.card;
      onCardsChange({
        ...cardsByList,
        [listId]: [...(cardsByList[listId] || []), newCard],
      });
    } catch (error) {
      console.error('Failed to add card:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await boardService.deleteList(board._id, listId);
      onListsChange(lists.filter((l) => l._id !== listId));
      const newCardsByList = { ...cardsByList };
      delete newCardsByList[listId];
      onCardsChange(newCardsByList);
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleUpdateList = async (listId: string, name: string) => {
    try {
      await boardService.updateList(board._id, listId, { name });
      onListsChange(lists.map((l) => (l._id === listId ? { ...l, name } : l)));
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const activeCard = activeType === 'card' && activeId
    ? Object.values(cardsByList).flat().find((card) => card._id === activeId)
    : null;

  const activeList = activeType === 'list' && activeId
    ? lists.find((list) => list._id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        <SortableContext
          items={lists.map((l) => l._id)}
          strategy={horizontalListSortingStrategy}
        >
          {lists.map((list) => (
            <KanbanList
              key={list._id}
              list={list}
              cards={cardsByList[list._id] || []}
              onAddCard={(title) => handleAddCard(list._id, title)}
              onDeleteList={() => handleDeleteList(list._id)}
              onUpdateList={(name) => handleUpdateList(list._id, name)}
            />
          ))}
        </SortableContext>

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddList();
                  if (e.key === 'Escape') setShowAddList(false);
                }}
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

      <DragOverlay>
        {activeCard && <KanbanCard card={activeCard} isDragging />}
        {activeList && (
          <div className="w-72 bg-gray-100 dark:bg-gray-700 rounded-lg p-3 opacity-80">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {activeList.name}
            </h3>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};
