import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const project = await queryOne(
    'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { name, emoji } = await req.json();

  const rows = await query(
    `UPDATE projects SET 
      name = COALESCE($1, name),
      emoji = COALESCE($2, emoji),
      updated_at = NOW()
     WHERE id = $3 AND user_id = $4 RETURNING *`,
    [name || null, emoji || null, id, session.user.id]
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [id, session.user.id]);
  return NextResponse.json({ success: true });
}
