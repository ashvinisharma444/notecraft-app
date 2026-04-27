'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Plus, Folder, ChevronRight, ChevronDown, Trash2,
  Edit3, LogOut, BookOpen, FileText, X, Check, Menu
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface Page { id: number; title: string; project_id: number; }
interface Project { id: number; name: string; emoji: string; pages?: Page[]; }

const EMOJIS = ['📁','📝','🚀','💡','📊','🎯','🔥','⚡','🌟','📌','🔖','💎'];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [pagesByProject, setPagesByProject] = useState<Record<number, Page[]>>({});
  const [editingProject, setEditingProject] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (res.ok) { const d = await res.json(); setProjects(d.projects); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const fetchPages = useCallback(async (projectId: number) => {
    const res = await fetch(`/api/pages?projectId=${projectId}`);
    if (res.ok) {
      const d = await res.json();
      setPagesByProject(prev => ({ ...prev, [projectId]: d.pages }));
    }
  }, []);

  const toggleExpanded = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); }
      else { next.add(id); fetchPages(id); }
      return next;
    });
  };

  const createProject = async () => {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Project', emoji: '📁' }),
    });
    if (res.ok) {
      const d = await res.json();
      setProjects(prev => [d.project, ...prev]);
      setEditingProject(d.project.id);
      setEditName('New Project');
    }
  };

  const renameProject = async (id: number) => {
    if (!editName.trim()) return;
    await fetch(`/api/projects/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setProjects(prev => prev.map(p => p.id === id ? { ...p, name: editName.trim() } : p));
    setEditingProject(null);
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Delete this project and all its pages?')) return;
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(p => p.id !== id));
    const cur = `/dashboard/${id}`;
    if (pathname.startsWith(cur)) router.push('/dashboard');
  };

  const createPage = async (projectId: number) => {
    const res = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, title: 'Untitled' }),
    });
    if (res.ok) {
      const d = await res.json();
      setPagesByProject(prev => ({ ...prev, [projectId]: [...(prev[projectId] || []), d.page] }));
      if (!expanded.has(projectId)) setExpanded(prev => new Set(prev).add(projectId));
      router.push(`/dashboard/${projectId}/${d.page.id}`);
    }
  };

  const deletePage = async (projectId: number, pageId: number) => {
    await fetch(`/api/pages/${pageId}`, { method: 'DELETE' });
    setPagesByProject(prev => ({
      ...prev, [projectId]: (prev[projectId] || []).filter(p => p.id !== pageId),
    }));
    if (pathname === `/dashboard/${projectId}/${pageId}`) router.push(`/dashboard/${projectId}`);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full" style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-fg)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-white">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span>NoteCraft</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button onClick={() => setMobileOpen(false)} className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Projects header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Projects
        </span>
        <button onClick={createProject}
          className="w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-white/10 text-indigo-400"
          title="New project">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading && <div className="px-3 py-2 text-sm text-slate-500">Loading…</div>}
        {!loading && !projects.length && (
          <div className="px-3 py-4 text-center">
            <Folder className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs text-slate-500">No projects yet</p>
            <button onClick={createProject} className="text-xs text-indigo-400 mt-1 hover:underline">Create one</button>
          </div>
        )}
        {projects.map(project => {
          const isExpanded = expanded.has(project.id);
          const pages = pagesByProject[project.id] || [];
          const isActive = pathname.startsWith(`/dashboard/${project.id}`);

          return (
            <div key={project.id}>
              <div className={`group flex items-center rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                style={{ marginBottom: '2px' }}>
                <button onClick={() => toggleExpanded(project.id)} className="flex items-center gap-1.5 flex-1 text-left min-w-0">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />}
                  <span className="text-base leading-none">{project.emoji}</span>
                  {editingProject === project.id ? (
                    <form onSubmit={e => { e.preventDefault(); renameProject(project.id); }} className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                      <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                        className="flex-1 min-w-0 bg-white/10 rounded px-1.5 py-0.5 text-sm text-white outline-none border border-indigo-500"
                        onBlur={() => renameProject(project.id)} />
                      <button type="submit" className="text-green-400 flex-shrink-0"><Check className="w-3.5 h-3.5" /></button>
                    </form>
                  ) : (
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--sidebar-fg)' }}>{project.name}</span>
                  )}
                </button>
                {editingProject !== project.id && (
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={e => { e.stopPropagation(); createPage(project.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Add page">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditingProject(project.id); setEditName(project.name); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Rename">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteProject(project.id); }}
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="ml-6 mb-1">
                  {pages.map(page => {
                    const pageActive = pathname === `/dashboard/${project.id}/${page.id}`;
                    return (
                      <div key={page.id} className={`group flex items-center rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${pageActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                        <Link href={`/dashboard/${project.id}/${page.id}`} className="flex items-center gap-2 flex-1 min-w-0"
                          onClick={() => setMobileOpen(false)}>
                          <FileText className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                          <span className="text-sm truncate" style={{ color: pageActive ? 'white' : 'rgba(205,214,244,0.7)' }}>{page.title || 'Untitled'}</span>
                        </Link>
                        <button onClick={() => deletePage(project.id, page.id)}
                          className="w-5 h-5 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20 text-slate-400 hover:text-red-400 flex-shrink-0">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {!pages.length && (
                    <button onClick={() => createPage(project.id)}
                      className="w-full text-left px-2 py-1.5 text-xs text-slate-500 hover:text-indigo-400 transition-colors rounded-lg hover:bg-white/5">
                      + New page
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <button onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors w-full">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-lg shadow-lg"
        style={{ background: 'var(--sidebar-bg)' }}>
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50 w-72 h-full"><SidebarContent /></div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen flex-shrink-0 sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
