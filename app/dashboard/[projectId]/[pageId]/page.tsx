'use client';
import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronRight, Check, Loader2 } from 'lucide-react';

const TipTapEditor = dynamic(
  () => import('@/components/editor/TipTapEditor').then(m => ({ default: m.TipTapEditor })),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  )}
);

interface Page { id: number; title: string; project_id: number; content: object; }
interface Project { id: number; name: string; emoji: string; }
type SaveState = 'saved' | 'saving' | 'unsaved';

export default function PageEditor({ params }: { params: Promise<{ projectId: string; pageId: string }> }) {
  const { projectId, pageId } = use(params);
  const [page, setPage] = useState<Page | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [loading, setLoading] = useState(true);
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const [pageRes, projRes] = await Promise.all([
        fetch(`/api/pages/${pageId}`),
        fetch(`/api/projects/${projectId}`),
      ]);
      if (pageRes.ok) {
        const d = await pageRes.json();
        setPage(d.page);
        setTitle(d.page.title || 'Untitled');
      }
      if (projRes.ok) {
        const d = await projRes.json();
        setProject(d.project);
      }
      setLoading(false);
    }
    load();
  }, [pageId, projectId]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSaveState('unsaved');
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      setSaveState('saving');
      await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: val }),
      });
      setSaveState('saved');
    }, 800);
  };

  const handleContentChange = (content: object) => {
    setSaveState('saving');
    setPage(prev => prev ? { ...prev, content } : prev);
    setTimeout(() => setSaveState('saved'), 1500);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--primary)' }} />
    </div>
  );

  if (!page) return (
    <div className="flex items-center justify-center h-screen text-lg" style={{ color: 'var(--muted)' }}>Page not found</div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ color: 'var(--foreground)' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b flex-shrink-0"
        style={{ background: 'var(--background)', borderColor: 'var(--border)' }}>
        <nav className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--muted)' }}>
          <Link href="/dashboard" className="hover:underline">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/dashboard/${projectId}`} className="hover:underline truncate max-w-32">
            {project ? `${project.emoji} ${project.name}` : 'Project'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="truncate max-w-40" style={{ color: 'var(--foreground)' }}>{title || 'Untitled'}</span>
        </nav>
        <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <Loader2 className="w-3 h-3 animate-spin" /> Saving…
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" /> Saved
            </span>
          )}
          {saveState === 'unsaved' && (
            <span style={{ color: 'var(--muted)' }}>Unsaved changes</span>
          )}
        </div>
      </header>

      {/* Page title */}
      <div className="px-6 md:px-12 pt-8 pb-2 flex-shrink-0 max-w-4xl mx-auto w-full">
        <input
          value={title}
          onChange={e => handleTitleChange(e.target.value)}
          placeholder="Untitled"
          className="text-4xl font-bold w-full outline-none bg-transparent placeholder:opacity-30"
          style={{ color: 'var(--foreground)' }}
        />
        <div className="h-px mt-4" style={{ background: 'var(--border)' }} />
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <TipTapEditor
          content={page.content || {}}
          onChange={handleContentChange}
          pageId={page.id}
        />
      </div>
    </div>
  );
}
