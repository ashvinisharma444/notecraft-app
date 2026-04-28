'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, FileText, Clock, Trash2, Edit3, Check, X,
  Sparkles, ArrowRight, BookOpen, FolderOpen
} from 'lucide-react';

/* ── Daily rotating quotes ─────────────────────────────────────── */
const QUOTES = [
  { q: 'The secret of getting ahead is getting started.', a: 'Mark Twain' },
  { q: 'Simplicity is the ultimate sophistication.', a: 'Leonardo da Vinci' },
  { q: 'An idea not coupled with action will never get any bigger than the brain cell it occupied.', a: 'Arnold Glasow' },
  { q: 'Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work.', a: 'Steve Jobs' },
  { q: 'The best way to predict the future is to create it.', a: 'Peter Drucker' },
  { q: 'It always seems impossible until it is done.', a: 'Nelson Mandela' },
  { q: 'In the middle of every difficulty lies opportunity.', a: 'Albert Einstein' },
  { q: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', a: 'Winston Churchill' },
  { q: 'The only way to do great work is to love what you do.', a: 'Steve Jobs' },
  { q: 'Done is better than perfect.', a: 'Sheryl Sandberg' },
  { q: 'Move fast and learn things.', a: 'Unknown' },
  { q: 'Think big, start small, act now.', a: 'Robin Sharma' },
  { q: 'Clarity is the new intelligence.', a: 'Unknown' },
  { q: 'Focus is not about saying yes — it is about saying no.', a: 'Steve Jobs' },
  { q: 'The quality of your thinking determines the quality of your outcomes.', a: 'Robin Sharma' },
  { q: 'Adaptability is about the powerful difference between adapting to cope and adapting to win.', a: 'Max McKeown' },
  { q: 'Strategy without tactics is the slowest route to victory. Tactics without strategy is the noise before defeat.', a: 'Sun Tzu' },
  { q: 'The art of communication is the language of leadership.', a: 'James Humes' },
  { q: 'Start where you are. Use what you have. Do what you can.', a: 'Arthur Ashe' },
  { q: 'Make each day your masterpiece.', a: 'John Wooden' },
  { q: 'You do not rise to the level of your goals. You fall to the level of your systems.', a: 'James Clear' },
  { q: 'The first step is you have to say that you can.', a: 'Will Smith' },
  { q: 'Excellence is never an accident. It is always the result of high intention.', a: 'Aristotle' },
  { q: 'Data is the new oil, but wisdom is the new gold.', a: 'Unknown' },
  { q: 'Leadership is not about being in charge. It is about taking care of those in your charge.', a: 'Simon Sinek' },
  { q: 'The measure of intelligence is the ability to change.', a: 'Albert Einstein' },
  { q: 'If you want to go fast, go alone. If you want to go far, go together.', a: 'African Proverb' },
  { q: 'Innovation distinguishes between a leader and a follower.', a: 'Steve Jobs' },
  { q: 'Energy and persistence conquer all things.', a: 'Benjamin Franklin' },
  { q: 'The future belongs to those who learn more skills and combine them in creative ways.', a: 'Robert Greene' },
  { q: 'Execution is the chariot of genius.', a: 'William Blake' },
  { q: 'Every moment is a fresh beginning.', a: 'T.S. Eliot' },
  { q: 'Your time is limited; don\'t waste it living someone else\'s life.', a: 'Steve Jobs' },
  { q: 'Great things are not done by impulse, but by a series of small things brought together.', a: 'Vincent Van Gogh' },
  { q: 'Ideas are easy. Implementation is hard.', a: 'Guy Kawasaki' },
  { q: 'Resilience is knowing that you are the only one that has the power and the responsibility to pick yourself up.', a: 'Mary Holloway' },
  { q: 'The richest investments you can make are in yourself.', a: 'Unknown' },
];

function getDailyQuote() {
  const dayOfYear = Math.floor(Date.now() / 86_400_000);
  return QUOTES[dayOfYear % QUOTES.length];
}

/* ── Sticky note colors ──────────────────────────────────────────── */
const COLORS = ['yellow','blue','pink','green','purple','orange'] as const;
type NoteColor = typeof COLORS[number];

interface StickyNote { id: number; content: string; color: NoteColor; position: number; }
interface RecentPage { id: number; title: string; project_id: number; updated_at: string; project_name: string; project_emoji: string; }

const colorDot: Record<NoteColor, string> = {
  yellow:'#fde047', blue:'#93c5fd', pink:'#f9a8d4',
  green:'#6ee7b7',  purple:'#c4b5fd', orange:'#fdba74',
};

/* ── Time helpers ────────────────────────────────────────────────── */
function getGreeting(name?: string) {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return name ? `${part}, ${name.split(' ')[0]}!` : `${part}!`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [userName, setUserName] = useState<string>('');
  const quote = getDailyQuote();

  /* sticky notes */
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteColor, setNewNoteColor] = useState<NoteColor>('yellow');
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);

  /* recent pages */
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  /* stats */
  const [stats, setStats] = useState({ projects: 0, pages: 0 });

  /* Live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* Fetch session name */
  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (d?.user?.name) setUserName(d.user.name);
    }).catch(() => {});
  }, []);

  /* Fetch sticky notes */
  const fetchNotes = useCallback(async () => {
    const res = await fetch('/api/sticky-notes');
    if (res.ok) { const d = await res.json(); setNotes(d.notes); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  /* Fetch recent pages + stats */
  useEffect(() => {
    fetch('/api/pages?recent=true')
      .then(r => r.json())
      .then(d => { setRecentPages(d.pages || []); setLoadingRecent(false); })
      .catch(() => setLoadingRecent(false));

    fetch('/api/projects')
      .then(r => r.json())
      .then(d => {
        const proj = d.projects?.length || 0;
        setStats(s => ({ ...s, projects: proj }));
      }).catch(() => {});
  }, []);

  /* sticky note CRUD */
  const addNote = async () => {
    if (!newNoteContent.trim()) { setAddingNote(false); return; }
    const res = await fetch('/api/sticky-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newNoteContent.trim(), color: newNoteColor }),
    });
    if (res.ok) {
      const d = await res.json();
      setNotes(prev => [...prev, d.note]);
    }
    setNewNoteContent(''); setAddingNote(false);
  };

  const saveEditNote = async (id: number) => {
    await fetch(`/api/sticky-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent }),
    });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content: editContent } : n));
    setEditingNote(null);
  };

  const deleteNote = async (id: number) => {
    await fetch(`/api/sticky-notes/${id}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const changeNoteColor = async (id: number, color: NoteColor) => {
    await fetch(`/api/sticky-notes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ color }),
    });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
  };

  /* date formatting */
  const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 2.5rem', maxWidth: 1200, margin: '0 auto' }}>

      {/* ── Top: greeting + date/time ─────────────────────────────── */}
      <div className="animate-fadeUp" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 0.25rem', color: 'var(--foreground)' }}>
            {getGreeting(userName)}
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.95rem' }}>
            Here&rsquo;s your workspace overview for today.
          </p>
        </div>

        {/* Date + time widget */}
        <div className="card animate-slideRight" style={{ padding: '1rem 1.4rem', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: 'var(--foreground)', lineHeight: 1 }}>
            {timeStr}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <Clock style={{ width: 13, height: 13 }} />
            {dayStr}
          </div>
        </div>
      </div>

      {/* ── Quote of the day ─────────────────────────────────────── */}
      <div className="card animate-fadeUp" style={{
        padding: '1.25rem 1.5rem', marginBottom: '2rem',
        borderLeft: '3px solid var(--primary)',
        animationDelay: '0.05s'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <Sparkles style={{ width: 18, height: 18, color: 'var(--primary)', flexShrink: 0, marginTop: 2 }} />
          <div>
            <p style={{ margin: '0 0 0.3rem', fontStyle: 'italic', fontSize: '0.97rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
              &ldquo;{quote.q}&rdquo;
            </p>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 500 }}>— {quote.a}</span>
          </div>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { icon: FolderOpen, label: 'Projects', value: stats.projects, color: '#6366f1' },
          { icon: FileText,   label: 'Recent Pages', value: recentPages.length, color: '#10b981' },
          { icon: BookOpen,   label: 'Sticky Notes', value: notes.length, color: '#f59e0b' },
        ].map(({ icon: Icon, label, value, color }, i) => (
          <div key={label} className="card animate-fadeUp" style={{ padding: '1.1rem 1.3rem', animationDelay: `${0.1 + i * 0.05}s` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 18, height: 18, color }} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--foreground)' }}>{value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main two-column grid ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: '1.5rem' }}>

        {/* ── Left: Recent pages ─────────────────────────────────── */}
        <div className="card animate-fadeUp" style={{ padding: '1.25rem', animationDelay: '0.2s' }}>
          <h2 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: '0 0 1rem' }}>
            Recent Pages
          </h2>

          {loadingRecent && (
            <div style={{ color: 'var(--muted)', fontSize: '0.875rem', padding: '1rem 0', textAlign: 'center' }}>Loading…</div>
          )}

          {!loadingRecent && recentPages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <FileText style={{ width: 32, height: 32, color: 'var(--border)', margin: '0 auto 0.5rem' }} />
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No pages yet</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Create a project and add pages from the sidebar</p>
            </div>
          )}

          {recentPages.map(page => (
            <button key={page.id}
              onClick={() => router.push(`/dashboard/${page.project_id}/${page.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.65rem 0.75rem', borderRadius: 8, border: 'none',
                background: 'transparent', cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--sidebar-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <FileText style={{ width: 15, height: 15, color: 'var(--primary)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {page.title || 'Untitled'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 1 }}>
                  {page.project_emoji} {page.project_name}
                </div>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(page.updated_at)}</div>
              <ArrowRight style={{ width: 13, height: 13, color: 'var(--muted)', flexShrink: 0 }} />
            </button>
          ))}
        </div>

        {/* ── Right: Sticky notes ───────────────────────────────── */}
        <div className="card animate-fadeUp" style={{ padding: '1.25rem', animationDelay: '0.25s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '0.88rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted)', margin: 0 }}>
              Sticky Notes
            </h2>
            <button
              onClick={() => { setAddingNote(true); setNewNoteContent(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.35rem 0.75rem', borderRadius: 20, border: '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer', fontSize: '0.78rem',
                color: 'var(--primary)', fontWeight: 600, transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--primary)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}>
              <Plus style={{ width: 13, height: 13 }} /> Add note
            </button>
          </div>

          {/* New note form */}
          {addingNote && (
            <div className="animate-scaleIn" style={{ marginBottom: '0.75rem', padding: '0.9rem', borderRadius: 10, background: 'var(--sidebar-hover)', border: '1px solid var(--border)' }}>
              <textarea
                autoFocus
                value={newNoteContent}
                onChange={e => setNewNoteContent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) addNote(); if (e.key === 'Escape') setAddingNote(false); }}
                placeholder="Write your note…"
                style={{ width: '100%', minHeight: 72, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--foreground)', fontSize: '0.875rem', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
              {/* Color picker */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Color:</span>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewNoteColor(c)}
                    title={c}
                    style={{
                      width: 18, height: 18, borderRadius: '50%', border: newNoteColor === c ? '2px solid var(--foreground)' : '2px solid transparent',
                      background: colorDot[c], cursor: 'pointer', transition: 'border 0.15s',
                    }} />
                ))}
                <div style={{ flex: 1 }} />
                <button onClick={() => setAddingNote(false)} style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--border)', background: 'transparent', color: 'var(--muted)', fontSize: '0.78rem', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={addNote} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: 'none', background: 'var(--primary)', color: 'white', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}>
                  Save
                </button>
              </div>
            </div>
          )}

          {notes.length === 0 && !addingNote && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📝</div>
              <p style={{ color: 'var(--muted)', fontSize: '0.875rem', margin: 0 }}>No sticky notes yet</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>Jot down quick thoughts and reminders</p>
            </div>
          )}

          {/* Notes grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.65rem' }}>
            {notes.map(note => (
              <div key={note.id} className={`sticky-${note.color} animate-scaleIn`}
                style={{
                  background: 'var(--sticky-bg)', border: '1px solid var(--sticky-border)',
                  borderRadius: 10, padding: '0.75rem', minHeight: 90,
                  display: 'flex', flexDirection: 'column', position: 'relative',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>

                {editingNote === note.id ? (
                  <>
                    <textarea
                      ref={editRef}
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingNote(null); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEditNote(note.id); }}
                      style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', color: 'var(--sticky-text)', fontSize: '0.82rem', lineHeight: 1.55, fontFamily: 'inherit', minHeight: 60 }}
                    />
                    <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
                      <button onClick={() => setEditingNote(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sticky-text)', opacity: 0.7 }}><X style={{ width: 13, height: 13 }} /></button>
                      <button onClick={() => saveEditNote(note.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sticky-text)' }}><Check style={{ width: 13, height: 13 }} /></button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ flex: 1, fontSize: '0.82rem', lineHeight: 1.55, color: 'var(--sticky-text)', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                      {note.content || <em style={{ opacity: 0.5 }}>Empty note</em>}
                    </p>

                    {/* Color + actions */}
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem', gap: '0.3rem', opacity: 0 }}
                      className="note-actions"
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                      {COLORS.map(c => (
                        <button key={c} onClick={() => changeNoteColor(note.id, c)}
                          style={{ width: 10, height: 10, borderRadius: '50%', background: colorDot[c], border: note.color === c ? '2px solid var(--sticky-text)' : 'none', cursor: 'pointer' }} />
                      ))}
                      <div style={{ flex: 1 }} />
                      <button onClick={() => { setEditingNote(note.id); setEditContent(note.content); setTimeout(() => editRef.current?.focus(), 30); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sticky-text)', opacity: 0.7, padding: 0 }}>
                        <Edit3 style={{ width: 12, height: 12 }} />
                      </button>
                      <button onClick={() => deleteNote(note.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sticky-text)', opacity: 0.7, padding: 0 }}>
                        <Trash2 style={{ width: 12, height: 12 }} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
