'use client';
import { useEffect, useCallback, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import bash from 'highlight.js/lib/languages/bash';
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  Code, CodeSquare, List, ListOrdered,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon,
  Minus, Undo2, Redo2, AlignLeft,
  Pencil, Share2, FileUp, Copy, Check, X,
} from 'lucide-react';
import { DrawingModal } from './DrawingModal';

const lowlight = createLowlight();
lowlight.register('javascript', javascript);
lowlight.register('typescript', typescript);
lowlight.register('python', python);
lowlight.register('sql', sql);
lowlight.register('bash', bash);
lowlight.register('js', javascript);
lowlight.register('ts', typescript);

interface TipTapEditorProps {
  content: object;
  onChange: (content: object) => void;
  pageId: number;
}

function ToolbarButton({ onClick, active, title, children, disabled }: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick(); }}
      title={title}
      disabled={disabled}
      className="w-8 h-8 flex items-center justify-center rounded transition-all disabled:opacity-40 flex-shrink-0"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'white' : 'var(--foreground)',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'var(--border)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-6 mx-1 flex-shrink-0" style={{ background: 'var(--border)' }} />;
}

/* Share popover */
function SharePopover({ pageId, onClose }: { pageId: number; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/pages/${pageId}/share`).then(r => r.json()).then(d => setToken(d.token));
  }, [pageId]);

  const generate = async () => {
    setLoading(true);
    const res = await fetch(`/api/pages/${pageId}/share`, { method: 'POST' });
    const d = await res.json();
    setToken(d.token);
    setLoading(false);
  };

  const revoke = async () => {
    await fetch(`/api/pages/${pageId}/share`, { method: 'DELETE' });
    setToken(null);
  };

  const shareUrl = token ? `${window.location.origin}/share/${token}` : '';

  const copy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: 'absolute', top: '110%', right: 0,
      background: 'var(--card-bg)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '1rem', width: 310,
      boxShadow: 'var(--shadow-lg)', zIndex: 100,
      animation: 'scaleIn 0.18s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--foreground)' }}>Share this page</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 2 }}>
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      {!token ? (
        <>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: '0 0 0.75rem', lineHeight: 1.5 }}>
            Generate a public read-only link anyone can view.
          </p>
          <button onClick={generate} disabled={loading}
            style={{ width: '100%', padding: '0.5rem', borderRadius: 8, border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
            {loading ? 'Generating…' : 'Generate share link'}
          </button>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
            <input readOnly value={shareUrl}
              style={{ flex: 1, padding: '0.4rem 0.6rem', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '0.75rem', outline: 'none', fontFamily: 'monospace' }} />
            <button onClick={copy}
              style={{ padding: '0.4rem 0.65rem', borderRadius: 7, border: '1px solid var(--border)', background: copied ? '#10b981' : 'var(--card-bg)', cursor: 'pointer', color: copied ? 'white' : 'var(--foreground)', transition: 'all 0.2s' }}>
              {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
            </button>
          </div>
          <button onClick={revoke}
            style={{ width: '100%', padding: '0.4rem', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--danger)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 500 }}>
            Revoke link
          </button>
        </>
      )}
    </div>
  );
}

/* PPTX parser (client-side via JSZip) */
async function parsePptx(file: File): Promise<{ title: string; text: string }[]> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(file);
  const slides: { title: string; text: string }[] = [];
  const slideFiles = Object.keys(zip.files)
    .filter(n => n.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const na = parseInt(a.match(/\d+/)?.[0] || '0');
      const nb = parseInt(b.match(/\d+/)?.[0] || '0');
      return na - nb;
    });

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'application/xml');
    const textNodes = doc.querySelectorAll('t');
    const texts: string[] = [];
    textNodes.forEach(t => { if (t.textContent?.trim()) texts.push(t.textContent.trim()); });
    const unique = [...new Set(texts)];
    const title = unique[0] || `Slide ${i + 1}`;
    const body  = unique.slice(1).join('\n');
    slides.push({ title, text: body });
  }
  return slides;
}

export function TipTapEditor({ content, onChange, pageId }: TipTapEditorProps) {
  const saveTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [drawOpen, setDrawOpen]   = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Placeholder.configure({ placeholder: 'Start writing… Use the toolbar above for formatting.' }),
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Underline,
      TextStyle,
      Color,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CodeBlockLowlight.configure({ lowlight, defaultLanguage: 'javascript' }),
    ],
    content: Object.keys(content).length ? content : undefined,
    editorProps: { attributes: { class: 'prose-editor' } },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange(json);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        fetch(`/api/pages/${pageId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: json }),
        }).catch(console.error);
      }, 1200);
    },
  });

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  /* Close share popover on outside click */
  useEffect(() => {
    if (!shareOpen) return;
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShareOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [shareOpen]);

  const insertImage = useCallback(() => {
    if (!editor) return;
    const url = window.prompt('Enter image URL:');
    if (url?.trim()) editor.chain().focus().setImage({ src: url.trim() }).run();
  }, [editor]);

  const uploadImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('pageId', String(pageId));
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const { url } = await res.json(); editor.chain().focus().setImage({ src: url }).run(); }
    } catch { console.error('Upload failed'); }
    e.target.value = '';
  }, [editor, pageId]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Enter URL:', prev || 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  /* Insert drawing as image */
  const handleDrawInsert = useCallback((dataUrl: string) => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: dataUrl }).run();
  }, [editor]);

  /* Import PPTX */
  const importPptx = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    try {
      const slides = await parsePptx(file);
      if (!slides.length) return;
      const commands = editor.chain().focus();
      slides.forEach((slide, i) => {
        if (i > 0) commands.setHorizontalRule();
        commands.insertContent({
          type: 'heading', attrs: { level: 2 },
          content: [{ type: 'text', text: slide.title }],
        });
        if (slide.text) {
          slide.text.split('\n').forEach(line => {
            if (line.trim()) {
              commands.insertContent({
                type: 'paragraph',
                content: [{ type: 'text', text: line.trim() }],
              });
            }
          });
        }
      });
      commands.run();
    } catch (err) { console.error('PPTX import failed', err); alert('Could not parse the PPTX file. Make sure it is a valid PowerPoint file.'); }
    e.target.value = '';
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center flex-wrap gap-0.5 px-4 py-2 border-b sticky top-0 z-10"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>

        {/* History */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo" disabled={!editor.can().undo()}>
          <Undo2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo" disabled={!editor.can().redo()}>
          <Redo2 className="w-4 h-4" />
        </ToolbarButton>
        <Divider />

        {/* Text */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline Code">
          <Code className="w-4 h-4" />
        </ToolbarButton>
        <Divider />

        {/* Headings */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive('paragraph')} title="Paragraph">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <Divider />

        {/* Lists */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <Divider />

        {/* Blocks */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code Block">
          <CodeSquare className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} title="Insert Table">
          <TableIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Link">
          <LinkIcon className="w-4 h-4" />
        </ToolbarButton>
        <Divider />

        {/* Images */}
        <ToolbarButton onClick={insertImage} title="Image URL">
          <ImageIcon className="w-4 h-4" />
        </ToolbarButton>
        <label className="w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors flex-shrink-0"
          title="Upload image"
          style={{ color: 'var(--foreground)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
        </label>
        <Divider />

        {/* Draw */}
        <ToolbarButton onClick={() => setDrawOpen(true)} title="Drawing canvas">
          <Pencil className="w-4 h-4" />
        </ToolbarButton>

        {/* PPTX import */}
        <label className="w-8 h-8 flex items-center justify-center rounded cursor-pointer transition-colors flex-shrink-0"
          title="Import PowerPoint (.pptx)"
          style={{ color: 'var(--foreground)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <FileUp className="w-4 h-4" />
          <input type="file" accept=".pptx" className="hidden" onChange={importPptx} />
        </label>

        {/* Share — right-aligned */}
        <div style={{ flex: 1 }} />
        <div ref={shareRef} style={{ position: 'relative' }}>
          <button
            onMouseDown={e => { e.preventDefault(); setShareOpen(v => !v); }}
            title="Share page"
            className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: shareOpen ? 'var(--primary)' : 'rgba(99,102,241,0.12)',
              color: shareOpen ? 'white' : 'var(--primary)',
              border: 'none', cursor: 'pointer',
            }}>
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
          {shareOpen && <SharePopover pageId={pageId} onClose={() => setShareOpen(false)} />}
        </div>
      </div>

      {/* ── Editor content ────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
          <EditorContent editor={editor} className="min-h-[60vh]" />
        </div>
      </div>

      {/* Drawing modal */}
      <DrawingModal open={drawOpen} onClose={() => setDrawOpen(false)} onInsert={handleDrawInsert} />
    </div>
  );
}
