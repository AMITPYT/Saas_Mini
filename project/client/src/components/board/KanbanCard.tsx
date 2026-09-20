import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../../services/board.service';
import {
  ChatBubbleLeftIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface KanbanCardProps {
  card: Card;
  isDragging?: boolean;
  onClick?: () => void;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  card,
  isDragging = false,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card._id,
    data: {
      type: 'card',
      card,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const completedItems = card.checklists?.reduce((acc, checklist) => {
    return acc + (checklist.items?.filter((item) => item.isCompleted)?.length || 0);
  }, 0) || 0;

  const totalItems = card.checklists?.reduce((acc, checklist) => {
    return acc + (checklist.items?.length || 0);
  }, 0) || 0;

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const isDueSoon = card.dueDate && !isOverdue &&
    new Date(card.dueDate) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'hover:shadow-md transition-shadow',
        'border border-transparent hover:border-primary-300 dark:hover:border-primary-700',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg rotate-3',
      )}
    >
      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.labels.map((label, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs font-medium rounded text-white"
              style={{ backgroundColor: label.color }}
              title={label.name}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <p className="text-sm text-gray-900 dark:text-white font-medium">
        {card.title}
      </p>

      {/* Description preview */}
      {card.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {card.description}
        </p>
      )}

      {/* Meta info */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {/* Due date */}
        {card.dueDate && (
          <span
            className={clsx(
              'flex items-center gap-1 px-1.5 py-0.5 text-xs rounded',
              isOverdue && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              isDueSoon && !isOverdue && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
              !isOverdue && !isDueSoon && 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            )}
          >
            <ClockIcon className="w-3 h-3" />
            {new Date(card.dueDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        )}

        {/* Checklist progress */}
        {totalItems > 0 && (
          <span
            className={clsx(
              'flex items-center gap-1 text-xs',
              completedItems === totalItems
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400'
            )}
          >
            <CheckCircleIcon className="w-3 h-3" />
            {completedItems}/{totalItems}
          </span>
        )}

        {/* Comments count */}
        {card.comments && card.comments.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <ChatBubbleLeftIcon className="w-3 h-3" />
            {card.comments.length}
          </span>
        )}

        {/* Attachments count */}
        {card.attachments && card.attachments.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <PaperClipIcon className="w-3 h-3" />
            {card.attachments.length}
          </span>
        )}
      </div>

      {/* Assignees */}
      {card.assignees && card.assignees.length > 0 && (
        <div className="flex -space-x-2 mt-2">
          {card.assignees.slice(0, 3).map((assignee, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 border-2 border-white dark:border-gray-800 flex items-center justify-center"
              title={assignee}
            >
              <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                {assignee.charAt(0).toUpperCase()}
              </span>
            </div>
          ))}
          {card.assignees.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                +{card.assignees.length - 3}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
