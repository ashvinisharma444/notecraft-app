import { queryOne } from '@/lib/db';
import { notFound } from 'next/navigation';
import { BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ token: string }> }

type TipTapMark = { type: string; attrs?: Record<string, string | undefined> };
type TipTapNode = {
  type: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, string | number | boolean | null | undefined>;
  marks?: TipTapMark[];
};

function renderNode(node: TipTapNode, key: number): ReactNode {
  const { type, content, attrs, text, marks } = node;

  if (type === 'text') {
    let el: ReactNode = text ?? '';
    if (marks) {
      for (const m of marks) {
        if (m.type === 'bold')           el = <strong key={key}>{el}</strong>;
        else if (m.type === 'italic')    el = <em key={key}>{el}</em>;
        else if (m.type === 'underline') el = <u key={key}>{el}</u>;
        else if (m.type === 'strike')    el = <s key={key}>{el}</s>;
        else if (m.type === 'code')      el = <code key={key}>{el}</code>;
        else if (m.type === 'link')      el = <a key={key} href={m.attrs?.href ?? '#'} target="_blank" rel="noopener noreferrer">{el}</a>;
      }
    }
    return el;
  }

  const kids = content?.map((c, i) => renderNode(c, i));

  switch (type) {
    case 'doc':        return <div key={key}>{kids}</div>;
    case 'paragraph':  return <p key={key}>{kids}</p>;
    case 'heading':    return attrs?.level === 1 ? <h1 key={key}>{kids}</h1>
                            : attrs?.level === 2 ? <h2 key={key}>{kids}</h2>
                            : <h3 key={key}>{kids}</h3>;
    case 'bulletList': return <ul key={key}>{kids}</ul>;
    case 'orderedList':return <ol key={key}>{kids}</ol>;
    case 'listItem':   return <li key={key}>{kids}</li>;
    case 'blockquote': return <blockquote key={key}>{kids}</blockquote>;
    case 'horizontalRule': return <hr key={key} />;
    case 'codeBlock':  return <pre key={key}><code>{kids}</code></pre>;
    case 'image':      return <img key={key} src={String(attrs?.src ?? '')} alt={String(attrs?.alt ?? '')} />;
    case 'hardBreak':  return <br key={key} />;
    case 'table':      return <table key={key}><tbody>{kids}</tbody></table>;
    case 'tableRow':   return <tr key={key}>{kids}</tr>;
    case 'tableHeader':return <th key={key}>{kids}</th>;
    case 'tableCell':  return <td key={key}>{kids}</td>;
    default:           return <div key={key}>{kids}</div>;
  }
}

interface PageRow {
  id: number;
  title: string;
  content: TipTapNode;
  updated_at: string;
  author_name: string;
  project_name: string;
  project_emoji: string;
}

export default async function SharePage({ params }: Props) {
  const { token } = await params;

  const raw = await queryOne(
    `SELECT p.id, p.title, p.content, p.updated_at,
            u.name AS author_name,
            pr.name AS project_name, pr.emoji AS project_emoji
     FROM pages p
     JOIN users u ON u.id = p.user_id
     JOIN projects pr ON pr.id = p.project_id
     WHERE p.share_token = $1`,
    [token]
  );

  if (!raw) notFound();

  const page = raw as unknown as PageRow;

  const updatedAt = new Date(page.updated_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Top bar */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--card-bg)',
        padding: '0.75rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--foreground)' }}>
          <BookOpen style={{ width: 20, height: 20, color: '#6366f1' }} />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>NoteCraft</span>
        </Link>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Read-only shared page</span>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 780, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Meta */}
        <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', fontSize: '0.82rem' }}>
          <span>{page.project_emoji} {page.project_name}</span>
          <span>·</span>
          <Clock style={{ width: 13, height: 13 }} />
          <span>Updated {updatedAt}</span>
          <span>·</span>
          <span>{page.author_name}</span>
        </div>

        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '2rem', lineHeight: 1.15 }}>
          {page.title || 'Untitled'}
        </h1>

        <div className="ProseMirror" style={{ pointerEvents: 'none' }}>
          {page.content && Object.keys(page.content).length > 0 && renderNode(page.content, 0)}
        </div>
      </main>
    </div>
  );
}
