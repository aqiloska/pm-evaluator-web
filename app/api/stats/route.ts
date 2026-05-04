import { NextResponse } from 'next/server';
import db from '../../../lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const totalRow = db.prepare('SELECT COUNT(*) as c, AVG(total) as avg FROM evaluations').get() as any;
  const distRows = db.prepare('SELECT position, COUNT(*) as c FROM evaluations GROUP BY position').all() as any[];
  const distribution: Record<string, number> = {};

  distRows.forEach((row) => {
    distribution[row.position || 'Unknown'] = row.c;
  });

  return NextResponse.json({
    totalCount: totalRow?.c || 0,
    avg: Math.round(totalRow?.avg || 0),
    distribution,
  });
}
