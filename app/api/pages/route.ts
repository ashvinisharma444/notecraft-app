import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const recent = searchParams.get('recent');

  if (recent) {
    /* Return the 8 most recently updated pages across all projects */
    const pages = await query(
      `SELECT p.id, p.title, p.project_id, p.updated_at,
              pr.name AS project_name, pr.emoji AS project_emoji
       FROM pages p
       JOIN projects pr ON pr.id = p.project_id
       WHERE p.user_id = $1
       ORDER BY p.updated_at DESC
       LIMIT 8`,
      [session.user.id]
    );
    return NextResponse.json({ pages });
  }

  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const pages = await query(
    `SELECT id, title, project_id, created_at, updated_at FROM pages
     WHERE project_id = $1 AND user_id = $2 ORDER BY created_at ASC`,
    [projectId, session.user.id]
  );
  return NextResponse.json({ pages });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { projectId, title = 'Untitled' } = await req.json();
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 });

  const rows = await query(
    `INSERT INTO pages (project_id, user_id, title, content)
     VALUES ($1, $2, $3, '{}') RETURNING id, title, project_id, created_at, updated_at`,
    [projectId, session.user.id, title]
  );
  return NextResponse.json({ page: rows[0] }, { status: 201 });
}
