import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const total = await pool.query(
    'SELECT COUNT(*) as c, AVG(total) as avg FROM evaluations'
  );

  const dist = await pool.query(
    'SELECT position, COUNT(*) as c FROM evaluations GROUP BY position'
  );

  const distribution: Record<string, number> = {};

  dist.rows.forEach((r) => {
    distribution[r.position] = Number(r.c);
  });

  return NextResponse.json({
    totalCount: Number(total.rows[0].c),
    avg: Math.round(Number(total.rows[0].avg || 0)),
    distribution,
  });
}