'use client';

import { useEditor, useEditorState, EditorContent, Extension, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { TaskList, TaskItem } from '@tiptap/extension-list';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { useEffect, useRef, useState } from 'react';
import { lowlight, CODE_LANGUAGES } from '@/lib/code-languages';
import { cleanPastedHtml } from '@/lib/clean-paste';
import { uploadImage, imageFilesFrom } from '@/lib/upload-image';

// Keep the existing Ctrl/Cmd+K shortcut for inline code
const KeyboardShortcuts = Extension.create({
  name: 'keyboardShortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => this.editor.chain().focus().toggleCode().run(),
    };
  },
});

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  /** 'compact' shows a short toolbar and a smaller editing area, for quick-entry dialogs */
  variant?: 'full' | 'compact';
}

export default function RichTextEditor({ content, onChange, placeholder = 'Start writing...', variant = 'full' }: RichTextEditorProps) {
  const compact = variant === 'compact';
  const editorRef = useRef<Editor | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Uploads image files and embeds them, at `pos` when dropped or at the cursor otherwise
  const insertImages = async (files: File[], pos?: number) => {
    setUploadError(null);
    setUploading(n => n + files.length);
    for (const file of files) {
      try {
        const src = await uploadImage(file);
        const alt = file.name.replace(/\.[^.]+$/, '');
        const node = { type: 'image', attrs: { src, alt: alt === 'image' ? 'Screenshot' : alt } };
        const ed = editorRef.current;
        if (!ed) continue;
        if (pos === undefined) {
          // A just-inserted image stays selected; add after it instead of replacing it
          const { selection } = ed.state;
          ed.chain().focus().insertContentAt('node' in selection ? selection.to : selection, node).run();
        } else {
          ed.chain().focus().insertContentAt(pos, node).run();
          pos += ed.state.doc.nodeAt(pos)?.nodeSize ?? 1;
        }
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      } finally {
        setUploading(n => n - 1);
      }
    }
  };

  const editor = useEditor({
    // Required with SSR: render the editor only after hydration
    immediatelyRender: false,
    extensions: [
      KeyboardShortcuts,
      StarterKit.configure({
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
        },
      }),
      Placeholder.configure({ placeholder }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full h-auto' },
        resize: {
          enabled: true,
          directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
          minWidth: 80,
          minHeight: 40,
          alwaysPreserveAspectRatio: true,
        },
      }),
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none px-6 py-4 ${compact ? 'min-h-[180px]' : 'min-h-[400px]'}`,
      },
      handlePaste: (view, event) => {
        // Screenshots and copied images arrive as files. Word also adds a picture of the
        // copied text, so files only win when the HTML has no text of its own.
        const images = imageFilesFrom(event.clipboardData?.files);
        const html = event.clipboardData?.getData('text/html');
        const htmlHasText = !!html && html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '';
        if (images.length > 0 && !htmlHasText) {
          insertImages(images);
          return true;
        }

        // Let the editor handle plain-text pastes and anything pasted inside a code block
        if (!html || view.state.selection.$from.parent.type.name === 'codeBlock') {
          return false;
        }
        editor?.commands.insertContent(cleanPastedHtml(html));
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const images = imageFilesFrom(event.dataTransfer?.files);
        if (images.length === 0) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        insertImages(images, pos);
        return true;
      },
    },
  });
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const pickImages = () => fileInputRef.current?.click();

  // Update editor content when prop changes (e.g. note loaded after mount)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return <div className={`border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse ${compact ? 'min-h-[230px]' : 'min-h-[460px]'}`} />;
  }

  return (
    <div className="border dark:border-gray-700 rounded-lg">
      {compact ? <CompactToolbar editor={editor} onPickImages={pickImages} /> : <Toolbar editor={editor} onPickImages={pickImages} />}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp,image/avif"
        multiple
        hidden
        onChange={(e) => {
          const files = imageFilesFrom(e.target.files);
          e.target.value = '';
          if (files.length) insertImages(files);
        }}
      />
      {(uploading > 0 || uploadError) && (
        <div className={`px-4 py-1.5 text-sm border-b dark:border-gray-700 ${uploadError ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
          {uploading > 0 ? `Uploading ${uploading === 1 ? 'image' : `${uploading} images`}…` : uploadError}
        </div>
      )}
      <div className="bg-white dark:bg-gray-900 rounded-b-lg">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({ editor, onPickImages }: { editor: Editor; onPickImages: () => void }) {
  // Re-render the toolbar on selection changes so active states stay accurate
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 1 }) ? 'h1'
        : e.isActive('heading', { level: 2 }) ? 'h2'
        : e.isActive('heading', { level: 3 }) ? 'h3'
        : e.isActive('heading', { level: 4 }) ? 'h4'
        : 'p',
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      highlight: e.isActive('highlight'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      alignLeft: e.isActive({ textAlign: 'left' }),
      alignCenter: e.isActive({ textAlign: 'center' }),
      alignRight: e.isActive({ textAlign: 'right' }),
      alignJustify: e.isActive({ textAlign: 'justify' }),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      taskList: e.isActive('taskList'),
      canIndent: e.can().sinkListItem('listItem') || e.can().sinkListItem('taskItem'),
      canOutdent: e.can().liftListItem('listItem') || e.can().liftListItem('taskItem'),
      blockquote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      codeLanguage: (e.getAttributes('codeBlock').language as string | null) ?? '',
      table: e.isActive('table'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();
  const listItemType = state.taskList ? 'taskItem' : 'listItem';

  const setBlock = (value: string) => {
    if (value === 'p') chain().setParagraph().run();
    else chain().setHeading({ level: Number(value[1]) as 1 | 2 | 3 | 4 }).run();
  };

  const setLink = () => promptForLink(editor);

  const addImageFromUrl = () => {
    const url = window.prompt('Image URL:', 'https://');
    if (url && url.trim() !== 'https://') chain().setImage({ src: url.trim() }).run();
  };

  return (
    <div className="sticky top-0 z-10 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
      <div className="p-1.5 flex flex-wrap items-center gap-0.5">
        <Btn title="Undo (Ctrl+Z)" onClick={() => chain().undo().run()} disabled={!state.canUndo}><Icon d={I.undo} /></Btn>
        <Btn title="Redo (Ctrl+Shift+Z)" onClick={() => chain().redo().run()} disabled={!state.canRedo}><Icon d={I.redo} /></Btn>

        <Sep />

        <select
          value={state.block}
          onChange={(e) => setBlock(e.target.value)}
          title="Text style"
          className="h-8 px-2 text-sm rounded border dark:border-gray-600 bg-white dark:bg-gray-900"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>

        <Sep />

        <Btn title="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}><span className="font-bold">B</span></Btn>
        <Btn title="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><span className="italic font-serif">I</span></Btn>
        <Btn title="Underline (Ctrl+U)" active={state.underline} onClick={() => chain().toggleUnderline().run()}><span className="underline">U</span></Btn>
        <Btn title="Strikethrough (Ctrl+Shift+S)" active={state.strike} onClick={() => chain().toggleStrike().run()}><span className="line-through">S</span></Btn>
        <Btn title="Highlight (Ctrl+Shift+H)" active={state.highlight} onClick={() => chain().toggleHighlight().run()}><Icon d={I.highlight} /></Btn>
        <Btn title="Inline code (Ctrl+K)" active={state.code} onClick={() => chain().toggleCode().run()}><Icon d={I.code} /></Btn>
        <Btn title="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}><Icon d={I.clear} /></Btn>

        <Sep />

        <Btn title="Align left" active={state.alignLeft} onClick={() => chain().setTextAlign('left').run()}><Icon d={I.alignLeft} /></Btn>
        <Btn title="Align center" active={state.alignCenter} onClick={() => chain().setTextAlign('center').run()}><Icon d={I.alignCenter} /></Btn>
        <Btn title="Align right" active={state.alignRight} onClick={() => chain().setTextAlign('right').run()}><Icon d={I.alignRight} /></Btn>
        <Btn title="Justify" active={state.alignJustify} onClick={() => chain().setTextAlign('justify').run()}><Icon d={I.alignJustify} /></Btn>

        <Sep />

        <Btn title="Bullet list (Ctrl+Shift+8)" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}><Icon d={I.bulletList} /></Btn>
        <Btn title="Numbered list (Ctrl+Shift+7)" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}><Icon d={I.orderedList} /></Btn>
        <Btn title="Checklist (Ctrl+Shift+9)" active={state.taskList} onClick={() => chain().toggleTaskList().run()}><Icon d={I.taskList} /></Btn>
        <Btn title="Decrease indent (Shift+Tab)" disabled={!state.canOutdent} onClick={() => chain().liftListItem(listItemType).run()}><Icon d={I.outdent} /></Btn>
        <Btn title="Increase indent (Tab)" disabled={!state.canIndent} onClick={() => chain().sinkListItem(listItemType).run()}><Icon d={I.indent} /></Btn>

        <Sep />

        <Btn title="Quote (Ctrl+Shift+B)" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}><Icon d={I.quote} /></Btn>
        <Btn title="Code block (Ctrl+Alt+C)" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}><Icon d={I.codeBlock} /></Btn>
        {state.codeBlock && (
          <select
            value={state.codeLanguage}
            onChange={(e) => chain().updateAttributes('codeBlock', { language: e.target.value || null }).run()}
            title="Code language"
            className="h-8 px-2 text-sm rounded border dark:border-gray-600 bg-white dark:bg-gray-900"
          >
            {CODE_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        )}
        <Btn title="Horizontal line" onClick={() => chain().setHorizontalRule().run()}><Icon d={I.hr} /></Btn>

        <Sep />

        <Btn title="Link" active={state.link} onClick={setLink}><Icon d={I.link} /></Btn>
        <Btn title="Insert image or screenshot (you can also paste or drop images)" onClick={onPickImages}><Icon d={I.image} /></Btn>
        <Btn title="Image from URL" onClick={addImageFromUrl}><Icon d={I.imageLink} /></Btn>
        <Btn title="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Icon d={I.table} /></Btn>
      </div>

      {/* Table tools appear only while the cursor is inside a table */}
      {state.table && (
        <div className="px-1.5 pb-1.5 flex flex-wrap items-center gap-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 mr-1">Table:</span>
          <TextBtn onClick={() => chain().addRowBefore().run()}>+ Row above</TextBtn>
          <TextBtn onClick={() => chain().addRowAfter().run()}>+ Row below</TextBtn>
          <TextBtn onClick={() => chain().addColumnBefore().run()}>+ Col left</TextBtn>
          <TextBtn onClick={() => chain().addColumnAfter().run()}>+ Col right</TextBtn>
          <TextBtn onClick={() => chain().toggleHeaderRow().run()}>Header row</TextBtn>
          <TextBtn onClick={() => chain().mergeOrSplit().run()}>Merge / split</TextBtn>
          <TextBtn danger onClick={() => chain().deleteRow().run()}>Delete row</TextBtn>
          <TextBtn danger onClick={() => chain().deleteColumn().run()}>Delete col</TextBtn>
          <TextBtn danger onClick={() => chain().deleteTable().run()}>Delete table</TextBtn>
        </div>
      )}
    </div>
  );
}

function promptForLink(editor: Editor) {
  const previous = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt('Link URL (leave empty to remove):', previous ?? 'https://');
  if (url === null) return;
  const chain = editor.chain().focus().extendMarkRange('link');
  if (url.trim() === '') chain.unsetLink().run();
  else chain.setLink({ href: url.trim() }).run();
}

// Short toolbar for the "Add a New Idea" dialog
function CompactToolbar({ editor, onPickImages }: { editor: Editor; onPickImages: () => void }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive('heading', { level: 2 }) ? 'h2' : e.isActive('heading', { level: 3 }) ? 'h3' : 'p',
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      bulletList: e.isActive('bulletList'),
      orderedList: e.isActive('orderedList'),
      blockquote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      link: e.isActive('link'),
    }),
  });
  const chain = () => editor.chain().focus();

  return (
    <div className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-t-lg p-1.5 flex flex-wrap items-center gap-0.5">
      <select
        value={state.block}
        onChange={(e) => {
          if (e.target.value === 'p') chain().setParagraph().run();
          else chain().setHeading({ level: e.target.value === 'h2' ? 2 : 3 }).run();
        }}
        title="Text style"
        className="h-8 px-2 text-sm rounded border dark:border-gray-600 bg-white dark:bg-gray-900"
      >
        <option value="p">Normal text</option>
        <option value="h2">Heading</option>
        <option value="h3">Subheading</option>
      </select>
      <Sep />
      <Btn title="Bold (Ctrl+B)" active={state.bold} onClick={() => chain().toggleBold().run()}><span className="font-bold">B</span></Btn>
      <Btn title="Italic (Ctrl+I)" active={state.italic} onClick={() => chain().toggleItalic().run()}><span className="italic font-serif">I</span></Btn>
      <Sep />
      <Btn title="Bulleted list" active={state.bulletList} onClick={() => chain().toggleBulletList().run()}><Icon d={I.bulletList} /></Btn>
      <Btn title="Numbered list" active={state.orderedList} onClick={() => chain().toggleOrderedList().run()}><Icon d={I.orderedList} /></Btn>
      <Btn title="Quote" active={state.blockquote} onClick={() => chain().toggleBlockquote().run()}><Icon d={I.quote} /></Btn>
      <Btn title="Code" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()}><Icon d={I.code} /></Btn>
      <Btn title="Insert link" active={state.link} onClick={() => promptForLink(editor)}><Icon d={I.link} /></Btn>
      <Btn title="Insert image or screenshot" onClick={onPickImages}><Icon d={I.image} /></Btn>
    </div>
  );
}

function Btn({ title, onClick, active, disabled, children }: {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={`h-8 min-w-8 px-1.5 inline-flex items-center justify-center rounded text-sm transition
        hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-35 disabled:hover:bg-transparent disabled:cursor-not-allowed
        ${active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200' : 'text-gray-700 dark:text-gray-200'}`}
    >
      {children}
    </button>
  );
}

function TextBtn({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 rounded border dark:border-gray-600 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-700
        ${danger ? 'text-red-600 dark:text-red-400' : ''}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />;
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

// 24x24 stroke icon paths
const I = {
  undo: 'M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  redo: 'm15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  highlight: 'm9 11-6 6v3h9l3-3M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4',
  code: 'm16 18 6-6-6-6M8 6l-6 6 6 6',
  clear: 'M4 7V4h16v3M5 20h6M13 4 8 20M15 15l5 5M20 15l-5 5',
  alignLeft: 'M21 6H3M15 12H3M17 18H3',
  alignCenter: 'M21 6H3M17 12H7M19 18H5',
  alignRight: 'M21 6H3M21 12H9M21 18H7',
  alignJustify: 'M3 6h18M3 12h18M3 18h18',
  bulletList: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  orderedList: 'M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1',
  taskList: 'm3 17 2 2 4-4M3 7l2 2 4-4M13 6h8M13 12h8M13 18h8',
  outdent: 'M7 8l-4 4 4 4M21 12H11M21 6H11M21 18H11',
  indent: 'm3 8 4 4-4 4M21 12H11M21 6H11M21 18H11',
  quote: 'M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zM15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z',
  codeBlock: 'M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM10 9l-3 3 3 3M14 9l3 3-3 3',
  hr: 'M3 12h18',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM21 15l-5-5L5 21M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  imageLink: 'M21 11V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6M3 16l5-5 3 3M8.5 8.5h.01M16 21l5-5M17 16h4v4',
  table: 'M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18',
};
