import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../lib/db';

export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Next.js 16 requires awaiting params
    const { id } = await context.params;
    const numericId = Number(id);

    // Validate ID
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { error: 'Invalid evaluation id' },
        { status: 400 }
      );
    }

    const res = await pool.query(
      'DELETE FROM evaluations WHERE id = $1',
      [numericId]
    );

    return NextResponse.json({
      deleted: res.rowCount || 0,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to delete evaluation' },
      { status: 500 }
    );
  }
}