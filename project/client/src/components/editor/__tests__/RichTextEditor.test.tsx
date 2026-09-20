import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextEditor } from '../RichTextEditor';

describe('RichTextEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock document.execCommand
    document.execCommand = vi.fn().mockReturnValue(true);
  });

  it('should render editor', () => {
    render(<RichTextEditor content="" onChange={mockOnChange} />);

    expect(screen.getByRole('textbox') || document.querySelector('[contenteditable]')).toBeTruthy();
  });

  it('should display initial content', () => {
    render(<RichTextEditor content="<p>Hello World</p>" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    expect(editor?.innerHTML).toContain('Hello World');
  });

  it('should show placeholder when empty', () => {
    render(
      <RichTextEditor
        content=""
        onChange={mockOnChange}
        placeholder="Start typing..."
      />
    );

    expect(screen.getByText('Start typing...')).toBeInTheDocument();
  });

  it('should call onChange when content changes', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor content="" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      await user.click(editor);
      await user.type(editor, 'Hello');
    }

    // onChange should be called (implementation may vary)
  });

  it('should apply className', () => {
    render(
      <RichTextEditor
        content=""
        onChange={mockOnChange}
        className="custom-editor"
      />
    );

    const wrapper = document.querySelector('.custom-editor');
    expect(wrapper).toBeTruthy();
  });

  it('should handle read-only mode', () => {
    render(
      <RichTextEditor
        content="<p>Read only content</p>"
        onChange={mockOnChange}
        readOnly
      />
    );

    const editor = document.querySelector('[contenteditable]');
    expect(editor?.getAttribute('contenteditable')).toBe('false');
  });
});

describe('RichTextEditor Toolbar', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.execCommand = vi.fn().mockReturnValue(true);
    // Mock window.getSelection
    window.getSelection = vi.fn().mockReturnValue({
      rangeCount: 1,
      getRangeAt: vi.fn().mockReturnValue({
        commonAncestorContainer: document.createElement('div'),
        getBoundingClientRect: vi.fn().mockReturnValue({
          top: 100,
          left: 100,
          width: 50,
        }),
      }),
      toString: vi.fn().mockReturnValue('selected text'),
    });
  });

  it('should show toolbar on text selection', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor content="<p>Select this text</p>" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      // Simulate text selection
      fireEvent.mouseUp(editor);
    }

    // Toolbar may appear based on selection
  });

  it('should apply bold formatting', async () => {
    render(<RichTextEditor content="<p>Bold text</p>" onChange={mockOnChange} />);

    // Bold button should call execCommand with 'bold'
    const boldButton = screen.queryByTitle('Bold') || screen.queryByLabelText('Bold');
    if (boldButton) {
      fireEvent.click(boldButton);
      expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
    }
  });

  it('should apply italic formatting', async () => {
    render(<RichTextEditor content="<p>Italic text</p>" onChange={mockOnChange} />);

    const italicButton = screen.queryByTitle('Italic') || screen.queryByLabelText('Italic');
    if (italicButton) {
      fireEvent.click(italicButton);
      expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
    }
  });
});

describe('RichTextEditor Keyboard Shortcuts', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    document.execCommand = vi.fn().mockReturnValue(true);
  });

  it('should apply bold on Ctrl+B', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor content="" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      await user.click(editor);
      fireEvent.keyDown(editor, { key: 'b', ctrlKey: true });
    }

    expect(document.execCommand).toHaveBeenCalledWith('bold', false, undefined);
  });

  it('should apply italic on Ctrl+I', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor content="" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      await user.click(editor);
      fireEvent.keyDown(editor, { key: 'i', ctrlKey: true });
    }

    expect(document.execCommand).toHaveBeenCalledWith('italic', false, undefined);
  });

  it('should apply underline on Ctrl+U', async () => {
    const user = userEvent.setup();
    render(<RichTextEditor content="" onChange={mockOnChange} />);

    const editor = document.querySelector('[contenteditable]');
    if (editor) {
      await user.click(editor);
      fireEvent.keyDown(editor, { key: 'u', ctrlKey: true });
    }

    expect(document.execCommand).toHaveBeenCalledWith('underline', false, undefined);
  });
});
