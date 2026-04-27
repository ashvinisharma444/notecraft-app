'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Clock, ArrowRight } from 'lucide-react';

interface Page { id: number; title: string; project_id: number; updated_at: string; }
interface Project { id: number; name: string; emoji: string; }

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [pr, pg] = await Promise.all([
        fetch(`/api/projects/${projectId}`).then(r => r.json()),
        fetch(`/api/pages?projectId=${projectId}`).then(r => r.json()),
      ]);
      setProject(pr.project);
      setPages(pg.pages || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  const createPage = async () => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: 'Untitled' }),
    });
    if (res.ok) {
      const d = await res.json();
      router.push(`/dashboard/${projectId}/${d.page.id}`);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin w-6 h-6 rounded-full border-2" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  if (!project) return (
    <div className="flex items-center justify-center h-screen text-lg" style={{ color: 'var(--muted)' }}>Project not found</div>
  );

  return (
    <div className="max-w-3xl mx-auto px-6 py-10" style={{ color: 'var(--foreground)' }}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{project.emoji}</span>
        <h1 className="text-3xl font-bold">{project.name}</h1>
      </div>
      <p className="mb-8" style={{ color: 'var(--muted)' }}>{pages.length} page{pages.length !== 1 ? 's' : ''}</p>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Pages</h2>
        <button onClick={createPage}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ background: 'var(--primary)' }}>
          <Plus className="w-4 h-4" /> New page
        </button>
      </div>

      {!pages.length ? (
        <div className="text-center py-16 rounded-xl" style={{ border: '2px dashed var(--border)' }}>
          <FileText className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p style={{ color: 'var(--muted)' }}>No pages yet</p>
          <button onClick={createPage} className="mt-3 text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Create your first page
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {pages.map(page => (
            <button key={page.id}
              onClick={() => router.push(`/dashboard/${projectId}/${page.id}`)}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all group"
              style={{ border: '1px solid var(--border)', background: 'var(--background)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <FileText className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--primary)' }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{page.title || 'Untitled'}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                  <Clock className="w-3 h-3" />
                  {new Date(page.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--primary)' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
