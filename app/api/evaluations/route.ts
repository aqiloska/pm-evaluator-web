import { NextRequest, NextResponse } from 'next/server';
import { pool, decidePosition, normalizeEvaluation } from '../../../lib/db';

export const runtime = 'nodejs';

// GET
export async function GET() {
  const res = await pool.query(
    'SELECT * FROM evaluations ORDER BY id DESC LIMIT 200'
  );
  return NextResponse.json(res.rows.map(normalizeEvaluation));
}

// POST
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const total = Number(body.total || 0);

    const result = await pool.query(
      `INSERT INTO evaluations
      (name, years, education, cert, skills, weights, scores, total, position, certSuggest, timestamp)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [
        body.name,
        body.years,
        body.education,
        body.cert,
        body.skills,
        body.weights,
        body.scores,
        total,
        decidePosition(total),
        body.certSuggest,
        new Date().toISOString(),
      ]
    );

    return NextResponse.json(normalizeEvaluation(result.rows[0]));
  } catch (e) {
    return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
  }
}