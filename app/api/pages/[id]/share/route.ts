import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { randomBytes } from 'crypto';

type Params = { params: Promise<{ id: string }> };

/* GET — returns existing share token (or null) */
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const page = await queryOne(
    'SELECT share_token FROM pages WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ token: page.share_token ?? null });
}

/* POST — generate (or return existing) share token */
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  const existing = await queryOne(
    'SELECT share_token FROM pages WHERE id = $1 AND user_id = $2',
    [id, session.user.id]
  );
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.share_token) return NextResponse.json({ token: existing.share_token });

  const token = randomBytes(24).toString('hex');
  await query('UPDATE pages SET share_token = $1 WHERE id = $2 AND user_id = $3', [token, id, session.user.id]);
  return NextResponse.json({ token });
}

/* DELETE — revoke share token */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;

  await query('UPDATE pages SET share_token = NULL WHERE id = $1 AND user_id = $2', [id, session.user.id]);
  return NextResponse.json({ success: true });
}
