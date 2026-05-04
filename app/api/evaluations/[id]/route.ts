import { NextRequest, NextResponse } from 'next/server';
import db from '../../../../lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid evaluation id' }, { status: 400 });
    }

    const info = db.prepare('DELETE FROM evaluations WHERE id = ?').run(id);
    return NextResponse.json({ deleted: info.changes });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete evaluation' }, { status: 500 });
  }
}
