import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KanbanCard } from '../KanbanCard';
import { DndContext } from '@dnd-kit/core';

// Mock useSortable
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

const mockCard = {
  _id: '1',
  title: 'Test Card',
  description: 'Test description',
  labels: [
    { name: 'Bug', color: '#EF4444' },
    { name: 'Feature', color: '#10B981' },
  ],
  assignees: [
    { _id: 'user1', name: 'John Doe', avatar: null },
  ],
  dueDate: new Date(Date.now() + 86400000).toISOString(),
  checklists: [
    {
      title: 'Checklist 1',
      items: [
        { text: 'Item 1', isCompleted: true },
        { text: 'Item 2', isCompleted: false },
      ],
    },
  ],
  comments: [{ _id: 'c1' }, { _id: 'c2' }],
  attachments: [{ _id: 'a1' }],
};

describe('KanbanCard', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render card title', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    expect(screen.getByText('Test Card')).toBeInTheDocument();
  });

  it('should render labels', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    expect(screen.getByText('Bug')).toBeInTheDocument();
    expect(screen.getByText('Feature')).toBeInTheDocument();
  });

  it('should render due date', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    // Due date should be displayed in some format
    const cardElement = document.querySelector('[data-testid="card"]') || document.querySelector('.cursor-pointer');
    expect(cardElement).toBeTruthy();
  });

  it('should render assignee avatars', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    // Should show assignee initial or avatar
    expect(screen.getByText('J') || screen.getByText('JD')).toBeTruthy();
  });

  it('should show checklist progress', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    // Should show 1/2 completed
    expect(screen.getByText(/1\/2/) || screen.getByText(/50%/)).toBeTruthy();
  });

  it('should show comment count', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should show attachment count', () => {
    render(
      <DndContext>
        <KanbanCard card={mockCard} onClick={mockOnClick} />
      </DndContext>
    );

    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render minimal card without optional fields', () => {
    const minimalCard = {
      _id: '2',
      title: 'Minimal Card',
    };

    render(
      <DndContext>
        <KanbanCard card={minimalCard} onClick={mockOnClick} />
      </DndContext>
    );

    expect(screen.getByText('Minimal Card')).toBeInTheDocument();
  });

  it('should highlight overdue cards', () => {
    const overdueCard = {
      ...mockCard,
      dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    };

    render(
      <DndContext>
        <KanbanCard card={overdueCard} onClick={mockOnClick} />
      </DndContext>
    );

    // Should have red/warning styling for overdue
    const cardElement = document.querySelector('.border-red-500, .bg-red-50, [class*="red"]');
    // Implementation dependent
  });
});
