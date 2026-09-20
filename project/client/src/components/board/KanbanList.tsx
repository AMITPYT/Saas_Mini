import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { KanbanCard } from './KanbanCard';
import { List, Card } from '../../services/board.service';
import {
  PlusIcon,
  EllipsisHorizontalIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface KanbanListProps {
  list: List;
  cards: Card[];
  onAddCard: (title: string) => void;
  onDeleteList: () => void;
  onUpdateList: (name: string) => void;
}

export const KanbanList: React.FC<KanbanListProps> = ({
  list,
  cards,
  onAddCard,
  onDeleteList,
  onUpdateList,
}) => {
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(list.name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list._id,
    data: {
      type: 'list',
      list,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleAddCard = () => {
    if (!newCardTitle.trim()) return;
    onAddCard(newCardTitle);
    setNewCardTitle('');
    setShowAddCard(false);
  };

  const handleSaveName = () => {
    if (editName.trim() && editName !== list.name) {
      onUpdateList(editName);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex-shrink-0 w-72 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col max-h-full"
    >
      {/* List header */}
      <div
        {...attributes}
        {...listeners}
        className="flex items-center justify-between p-3 cursor-grab active:cursor-grabbing"
      >
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveName();
              if (e.key === 'Escape') {
                setEditName(list.name);
                setIsEditing(false);
              }
            }}
            className="flex-1 px-2 py-1 text-sm font-semibold bg-white dark:bg-gray-800 border border-primary-500 rounded text-gray-900 dark:text-white"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            {list.name}
            <span className="text-sm font-normal text-gray-500">
              {cards.length}
            </span>
          </h3>
        )}

        <Menu as="div" className="relative">
          <Menu.Button
            onClick={(e) => e.stopPropagation()}
            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <EllipsisHorizontalIcon className="w-5 h-5 text-gray-500" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20">
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded ${
                        active ? 'bg-gray-100 dark:bg-gray-700' : ''
                      } text-gray-700 dark:text-gray-300`}
                    >
                      <PencilIcon className="w-4 h-4" />
                      Rename
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onDeleteList}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded ${
                        active ? 'bg-red-50 dark:bg-red-900/20' : ''
                      } text-red-600 dark:text-red-400`}
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[50px]">
        <SortableContext
          items={cards.map((c) => c._id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard key={card._id} card={card} />
          ))}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="p-2">
        {showAddCard ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              className="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-white resize-none focus:ring-0"
              rows={2}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') {
                  setShowAddCard(false);
                  setNewCardTitle('');
                }
              }}
            />
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleAddCard}
                className="px-3 py-1 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
              >
                Add Card
              </button>
              <button
                onClick={() => {
                  setShowAddCard(false);
                  setNewCardTitle('');
                }}
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
