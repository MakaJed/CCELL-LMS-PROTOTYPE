import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold, Italic, UnderlineIcon, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Quote, Code, Undo2, Redo2, Minus,
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      className={`p-1.5 rounded transition-colors text-sm
        ${active ? 'bg-[#1A237E] text-white' : 'hover:bg-gray-200 text-gray-700'}
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '140px',
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  if (!editor) return null;

  const Divider = () => <div className="w-px bg-gray-300 mx-1 self-stretch" />;

  return (
    <div
      className={`border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#1A237E]/30 focus-within:border-[#1A237E] transition-colors ${disabled ? 'opacity-60' : ''}`}
      style={{ borderColor: 'var(--border)' }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50/80" style={{ borderColor: 'var(--border)' }}>
        {/* Undo / Redo */}
        <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Headings */}
        <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Inline formatting */}
        <ToolbarButton title="Bold (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Italic (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Underline (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Inline code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Numbered list" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>

        <Divider />

        {/* Blockquote + HR */}
        <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton title="Horizontal rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="h-3.5 w-3.5" />
        </ToolbarButton>
      </div>

      {/* ── Editor area ──────────────────────────────────────────────────── */}
      <EditorContent
        editor={editor}
        className="rich-editor px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
        style={{ minHeight }}
      />

      {/* Prose styles injected via a style tag so no Tailwind typography plugin needed */}
      <style>{`
        .rich-editor .ProseMirror { outline: none; min-height: ${minHeight}; }
        .rich-editor .ProseMirror p { margin: 0 0 0.5em 0; }
        .rich-editor .ProseMirror h2 { font-size: 1.25em; font-weight: 700; margin: 0.75em 0 0.35em; color: #1A237E; }
        .rich-editor .ProseMirror h3 { font-size: 1.05em; font-weight: 600; margin: 0.6em 0 0.3em; color: #283593; }
        .rich-editor .ProseMirror ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .rich-editor .ProseMirror ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .rich-editor .ProseMirror li { margin: 0.15em 0; }
        .rich-editor .ProseMirror blockquote { border-left: 3px solid #1A237E; padding-left: 0.75em; color: #555; margin: 0.5em 0; font-style: italic; }
        .rich-editor .ProseMirror code { background: #f1f5f9; padding: 0.1em 0.35em; border-radius: 0.25em; font-family: monospace; font-size: 0.9em; }
        .rich-editor .ProseMirror hr { border: none; border-top: 1px solid #e2e8f0; margin: 0.75em 0; }
        .rich-editor .ProseMirror strong { font-weight: 700; }
        .rich-editor .ProseMirror em { font-style: italic; }
        .rich-editor .ProseMirror u { text-decoration: underline; }
        .rich-editor .ProseMirror s { text-decoration: line-through; }
        .rich-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          float: left;
          height: 0;
        }
      `}</style>
    </div>
  );
}
