import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Card, cardService } from '../../services/board.service';
import { useAuthStore } from '../../store/authStore';
import {
  XMarkIcon,
  PencilIcon,
  TagIcon,
  UserPlusIcon,
  CalendarIcon,
  PaperClipIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface CardModalProps {
  card: Card | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

const LABEL_COLORS = [
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
];

export const CardModal: React.FC<CardModalProps> = ({
  card,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [newChecklistName, setNewChecklistName] = useState('');
  const [showAddChecklist, setShowAddChecklist] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description || '');
    }
  }, [card]);

  const handleSaveTitle = async () => {
    if (!card || !title.trim()) return;
    setSaving(true);
    try {
      const response = await cardService.update(card._id, { title });
      onUpdate(response.data.data.card);
    } catch (error) {
      console.error('Failed to update title:', error);
    } finally {
      setSaving(false);
      setIsEditingTitle(false);
    }
  };

  const handleSaveDescription = async () => {
    if (!card) return;
    setSaving(true);
    try {
      const response = await cardService.update(card._id, { description });
      onUpdate(response.data.data.card);
    } catch (error) {
      console.error('Failed to update description:', error);
    } finally {
      setSaving(false);
      setIsEditingDescription(false);
    }
  };

  const handleAddComment = async () => {
    if (!card || !newComment.trim()) return;
    try {
      await cardService.addComment(card._id, newComment);
      // Refresh card data
      const response = await cardService.getById(card._id);
      onUpdate(response.data.data.card);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleAddChecklist = async () => {
    if (!card || !newChecklistName.trim()) return;
    try {
      await cardService.addChecklist(card._id, newChecklistName);
      const response = await cardService.getById(card._id);
      onUpdate(response.data.data.card);
      setNewChecklistName('');
      setShowAddChecklist(false);
    } catch (error) {
      console.error('Failed to add checklist:', error);
    }
  };

  const handleToggleChecklistItem = async (checklistId: string, itemId: string, isCompleted: boolean) => {
    if (!card) return;
    try {
      await cardService.updateChecklistItem(card._id, checklistId, itemId, {
        isCompleted: !isCompleted,
      });
      const response = await cardService.getById(card._id);
      onUpdate(response.data.data.card);
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  const handleDelete = async () => {
    if (!card || !confirm('Are you sure you want to delete this card?')) return;
    try {
      await cardService.delete(card._id);
      onDelete(card._id);
      onClose();
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  if (!card) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 pt-16">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex-1">
                    {isEditingTitle ? (
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleSaveTitle}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveTitle();
                          if (e.key === 'Escape') {
                            setTitle(card.title);
                            setIsEditingTitle(false);
                          }
                        }}
                        className="w-full text-xl font-semibold bg-transparent border-b-2 border-primary-500 text-gray-900 dark:text-white focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <h2
                        className="text-xl font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600"
                        onClick={() => setIsEditingTitle(true)}
                      >
                        {card.title}
                      </h2>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      in list <span className="font-medium">{card.listId}</span>
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex">
                  {/* Main content */}
                  <div className="flex-1 p-6 space-y-6">
                    {/* Labels */}
                    {card.labels && card.labels.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Labels
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {card.labels.map((label, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 text-sm font-medium rounded text-white"
                              style={{ backgroundColor: label.color }}
                            >
                              {label.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <PencilIcon className="w-4 h-4" />
                        Description
                      </h3>
                      {isEditingDescription ? (
                        <div>
                          <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            rows={4}
                            placeholder="Add a more detailed description..."
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={handleSaveDescription}
                              className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setDescription(card.description || '');
                                setIsEditingDescription(false);
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setIsEditingDescription(true)}
                          className="min-h-[60px] p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {description ? (
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {description}
                            </p>
                          ) : (
                            <p className="text-gray-400">
                              Add a more detailed description...
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Checklists */}
                    {card.checklists && card.checklists.length > 0 && (
                      <div className="space-y-4">
                        {card.checklists.map((checklist) => {
                          const completed = checklist.items?.filter((i) => i.isCompleted).length || 0;
                          const total = checklist.items?.length || 0;
                          const progress = total > 0 ? (completed / total) * 100 : 0;

                          return (
                            <div key={checklist._id}>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                  <CheckIcon className="w-4 h-4" />
                                  {checklist.name}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {completed}/{total}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mb-2">
                                <div
                                  className="h-full bg-primary-500 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <div className="space-y-1">
                                {checklist.items?.map((item) => (
                                  <label
                                    key={item._id}
                                    className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.isCompleted}
                                      onChange={() =>
                                        handleToggleChecklistItem(
                                          checklist._id,
                                          item._id,
                                          item.isCompleted
                                        )
                                      }
                                      className="rounded text-primary-600"
                                    />
                                    <span
                                      className={clsx(
                                        'text-sm',
                                        item.isCompleted && 'line-through text-gray-400'
                                      )}
                                    >
                                      {item.text}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Comments */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Comments
                      </h3>
                      <div className="flex gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
                            {user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none text-sm"
                            rows={2}
                          />
                          {newComment && (
                            <button
                              onClick={handleAddComment}
                              className="mt-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                            >
                              Save
                            </button>
                          )}
                        </div>
                      </div>
                      {card.comments && card.comments.length > 0 && (
                        <div className="space-y-4">
                          {card.comments.map((comment) => (
                            <div key={comment._id} className="flex gap-3">
                              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {comment.userId?.firstName?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {comment.userId?.firstName} {comment.userId?.lastName}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar actions */}
                  <div className="w-48 p-6 border-l border-gray-200 dark:border-gray-700 space-y-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Add to card
                    </p>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      <UserPlusIcon className="w-4 h-4" />
                      Members
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      <TagIcon className="w-4 h-4" />
                      Labels
                    </button>
                    <button
                      onClick={() => setShowAddChecklist(true)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      <CheckIcon className="w-4 h-4" />
                      Checklist
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      Due Date
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                      <PaperClipIcon className="w-4 h-4" />
                      Attachment
                    </button>

                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/40"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* Add checklist modal */}
                {showAddChecklist && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 w-80">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                        Add Checklist
                      </h3>
                      <input
                        type="text"
                        value={newChecklistName}
                        onChange={(e) => setNewChecklistName(e.target.value)}
                        placeholder="Checklist name"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleAddChecklist}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowAddChecklist(false);
                            setNewChecklistName('');
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
