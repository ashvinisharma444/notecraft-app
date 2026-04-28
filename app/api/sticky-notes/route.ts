import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const notes = await query(
    'SELECT * FROM sticky_notes WHERE user_id = $1 ORDER BY position ASC, created_at ASC',
    [session.user.id]
  );
  return NextResponse.json({ notes });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { content = '', color = 'yellow' } = await req.json();

  const rows = await query(
    `INSERT INTO sticky_notes (user_id, content, color, position)
     VALUES ($1, $2, $3, (SELECT COALESCE(MAX(position),0)+1 FROM sticky_notes WHERE user_id=$1))
     RETURNING *`,
    [session.user.id, content, color]
  );
  return NextResponse.json({ note: rows[0] }, { status: 201 });
}
