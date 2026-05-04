export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // ensure table exists (safe to run on every request)
    await env.PM_DB.prepare(`CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      years INTEGER,
      education TEXT,
      cert TEXT,
      skills TEXT,
      weights TEXT,
      scores TEXT,
      total INTEGER,
      position TEXT,
      certSuggest TEXT,
      timestamp TEXT
    )`).run();

    const headers = new Headers({ 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });

    try {
      // POST /api/evaluations
      if (path === '/api/evaluations' && method === 'POST') {
        const payload = await request.json();
        const stmt = await env.PM_DB.prepare(
          `INSERT INTO evaluations (name, years, education, cert, skills, weights, scores, total, position, certSuggest, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );
        const info = await stmt.run(
          payload.name,
          payload.years || 0,
          payload.education || '',
          payload.cert || '',
          JSON.stringify(payload.skills || {}),
          JSON.stringify(payload.weights || {}),
          JSON.stringify(payload.scores || {}),
          payload.total || 0,
          payload.position || '',
          JSON.stringify(payload.certSuggest || []),
          new Date().toISOString()
        );
        const id = info.lastInsertRowid;
        const row = await env.PM_DB.prepare('SELECT * FROM evaluations WHERE id = ?').bind(id).first();
        return new Response(JSON.stringify(row), { headers });
      }

      // GET /api/evaluations
      if (path === '/api/evaluations' && method === 'GET') {
        const rows = await env.PM_DB.prepare('SELECT * FROM evaluations ORDER BY id DESC LIMIT 1000').all();
        // parse fields
        const parsed = rows.results.map((r: any) => ({
          ...r,
          skills: r.skills ? JSON.parse(r.skills) : {},
          weights: r.weights ? JSON.parse(r.weights) : {},
          scores: r.scores ? JSON.parse(r.scores) : {},
          certSuggest: r.certSuggest ? JSON.parse(r.certSuggest) : []
        }));
        return new Response(JSON.stringify(parsed), { headers });
      }

      // GET /api/evaluation/:id
      const evalMatch = path.match(/^\/api\/evaluation\/(\d+)$/);
      if (evalMatch && method === 'GET') {
        const id = Number(evalMatch[1]);
        const row = await env.PM_DB.prepare('SELECT * FROM evaluations WHERE id = ?').bind(id).first();
        if (!row) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
        const parsed = { ...row, skills: row.skills ? JSON.parse(row.skills) : {}, weights: row.weights ? JSON.parse(row.weights) : {}, scores: row.scores ? JSON.parse(row.scores) : {}, certSuggest: row.certSuggest ? JSON.parse(row.certSuggest) : [] };
        return new Response(JSON.stringify(parsed), { headers });
      }

      // DELETE /api/evaluations/:id
      const delMatch = path.match(/^\/api\/evaluations\/(\d+)$/);
      if (delMatch && method === 'DELETE') {
        const id = Number(delMatch[1]);
        const info = await env.PM_DB.prepare('DELETE FROM evaluations WHERE id = ?').bind(id).run();
        return new Response(JSON.stringify({ deleted: info.changes }), { headers });
      }

      // GET /api/stats
      if (path === '/api/stats' && method === 'GET') {
        const totalRow = await env.PM_DB.prepare('SELECT COUNT(*) AS c, AVG(total) as avg FROM evaluations').first();
        const distRows = await env.PM_DB.prepare('SELECT position, COUNT(*) as c FROM evaluations GROUP BY position').all();
        const distribution: any = {};
        (distRows.results || []).forEach((r: any) => { distribution[r.position] = r.c; });
        const totalCount = totalRow ? totalRow.c : 0;
        const avg = totalRow ? Math.round(totalRow.avg || 0) : 0;
        return new Response(JSON.stringify({ totalCount, avg, distribution }), { headers });
      }

      // Fallback: 404
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });

    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers });
    }
  }
};