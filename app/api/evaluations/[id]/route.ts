import { NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);

  const res = await pool.query(
    'DELETE FROM evaluations WHERE id = $1',
    [id]
  );

  return NextResponse.json({ deleted: res.rowCount });
}