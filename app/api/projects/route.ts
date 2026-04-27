import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const projects = await query(
    'SELECT id, name, emoji, created_at, updated_at FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
    [session.user.id]
  );
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, emoji = '📁' } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: 'Project name required' }, { status: 400 });

  const rows = await query(
    'INSERT INTO projects (user_id, name, emoji) VALUES ($1, $2, $3) RETURNING *',
    [session.user.id, name.trim(), emoji]
  );
  return NextResponse.json({ project: rows[0] }, { status: 201 });
}
