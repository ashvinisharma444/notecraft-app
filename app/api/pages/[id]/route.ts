import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const page = await queryOne(
    'SELECT * FROM pages WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (body.title !== undefined) { fields.push(`title = $${idx++}`); values.push(body.title); }
  if (body.content !== undefined) { fields.push(`content = $${idx++}`); values.push(JSON.stringify(body.content)); }
  if (!fields.length) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });

  fields.push('updated_at = NOW()');
  values.push(id, session.user.id);

  const rows = await query(
    `UPDATE pages SET ${fields.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values
  );
  if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ page: rows[0] });
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await query('DELETE FROM pages WHERE id = $1 AND user_id = $2', [id, session.user.id]);
  return NextResponse.json({ success: true });
}
