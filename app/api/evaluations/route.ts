import { NextRequest, NextResponse } from 'next/server';
import db, { decidePosition, normalizeEvaluation } from '../../../lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const rows = db.prepare('SELECT * FROM evaluations ORDER BY id DESC LIMIT 200').all();
  return NextResponse.json(rows.map((row: any) => normalizeEvaluation(row)));
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const stmt = db.prepare(`INSERT INTO evaluations
      (name, years, education, cert, skills, weights, scores, total, position, certSuggest, timestamp)
      VALUES (@name,@years,@education,@cert,@skills,@weights,@scores,@total,@position,@certSuggest,@timestamp)`);

    const total = Number(payload.total || 0);
    const info = stmt.run({
      name: payload.name || '',
      years: Number(payload.years || 0),
      education: payload.education || '',
      cert: payload.cert || '',
      skills: JSON.stringify(payload.skills || {}),
      weights: JSON.stringify(payload.weights || {}),
      scores: JSON.stringify(payload.scores || {}),
      total,
      position: payload.position || decidePosition(total),
      certSuggest: JSON.stringify(payload.certSuggest || []),
      timestamp: new Date().toISOString(),
    });

    const row = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(normalizeEvaluation(row as any));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
