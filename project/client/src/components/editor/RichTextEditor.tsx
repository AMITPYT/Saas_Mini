import { useRef, useEffect, useState, useCallback } from 'react';
import {
  BoldIcon,
  ItalicIcon,
  UnderlineIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  CodeBracketIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

interface ToolbarButton {
  icon: React.ComponentType<{ className?: string }>;
  command: string;
  value?: string;
  title: string;
}

const toolbarButtons: ToolbarButton[] = [
  { icon: BoldIcon, command: 'bold', title: 'Bold (Ctrl+B)' },
  { icon: ItalicIcon, command: 'italic', title: 'Italic (Ctrl+I)' },
  { icon: UnderlineIcon, command: 'underline', title: 'Underline (Ctrl+U)' },
  { icon: CodeBracketIcon, command: 'formatBlock', value: 'pre', title: 'Code Block' },
  { icon: ListBulletIcon, command: 'insertUnorderedList', title: 'Bullet List' },
  { icon: NumberedListIcon as any, command: 'insertOrderedList', title: 'Numbered List' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  placeholder = 'Start writing...',
  className,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const [isEmpty, setIsEmpty] = useState(!content);

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content;
      setIsEmpty(!content);
    }
  }, [content]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const textContent = editorRef.current.textContent || '';
      setIsEmpty(!textContent.trim());
      onChange(html);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      document.execCommand('insertText', false, '  ');
    }

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  }, []);

  const handleSelect = useCallback(() => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current?.getBoundingClientRect();

      if (editorRect) {
        setToolbarPosition({
          top: rect.top - editorRect.top - 45,
          left: rect.left - editorRect.left + rect.width / 2 - 100,
        });
        setShowToolbar(true);
      }
    } else {
      setShowToolbar(false);
    }
  }, []);

  const executeCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  return (
    <div className={clsx('relative', className)}>
      {/* Floating toolbar */}
      {showToolbar && !readOnly && (
        <div
          className="absolute z-10 flex items-center gap-1 p-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
          style={{
            top: `${toolbarPosition.top}px`,
            left: `${toolbarPosition.left}px`,
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {toolbarButtons.map((button) => (
            <button
              key={button.command}
              onClick={() => executeCommand(button.command, button.value)}
              title={button.title}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <button.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        {isEmpty && !readOnly && (
          <div className="absolute top-0 left-0 text-gray-400 dark:text-gray-500 pointer-events-none">
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable={!readOnly}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={handleSelect}
          onBlur={() => setTimeout(() => setShowToolbar(false), 200)}
          onPaste={handlePaste}
          className={clsx(
            'min-h-[200px] outline-none',
            'prose dark:prose-invert max-w-none',
            'prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white',
            'prose-p:text-gray-700 dark:prose-p:text-gray-300',
            'prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded',
            'prose-pre:bg-gray-900 prose-pre:text-gray-100',
            'prose-ul:list-disc prose-ol:list-decimal',
            'prose-li:text-gray-700 dark:prose-li:text-gray-300',
            readOnly && 'cursor-default'
          )}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
};

// Block-based editor toolbar component
export const EditorToolbar: React.FC<{
  onCommand: (command: string, value?: string) => void;
}> = ({ onCommand }) => {
  const headingOptions = [
    { label: 'Normal', value: 'p' },
    { label: 'Heading 1', value: 'h1' },
    { label: 'Heading 2', value: 'h2' },
    { label: 'Heading 3', value: 'h3' },
  ];

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
      <select
        onChange={(e) => onCommand('formatBlock', e.target.value)}
        className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {headingOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {toolbarButtons.map((button) => (
        <button
          key={button.command}
          onClick={() => onCommand(button.command, button.value)}
          title={button.title}
          className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <button.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      ))}

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      <button
        onClick={() => {
          const url = prompt('Enter link URL:');
          if (url) onCommand('createLink', url);
        }}
        title="Insert Link"
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <LinkIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>

      <button
        onClick={() => {
          const url = prompt('Enter image URL:');
          if (url) onCommand('insertImage', url);
        }}
        title="Insert Image"
        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <PhotoIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
};
