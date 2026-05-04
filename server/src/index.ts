import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Database from 'better-sqlite3';
import path from 'path';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const DB_PATH = path.join(__dirname, '../../pm-evaluator.db');
const db = new Database(DB_PATH);

// initialize table
db.prepare(`CREATE TABLE IF NOT EXISTS evaluations (
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

// Serve static frontend
app.use(express.static(path.join(__dirname, '../../public')));

// Helpers
function decide(total:number){
  if(total>=80) return 'Senior Project Manager';
  if(total>=60) return 'Project Manager';
  if(total>=40) return 'Junior Project Manager';
  return 'Not Qualified';
}

app.post('/api/evaluations', (req, res) => {
  try{
    const payload = req.body;
    // expected payload: { name, years, education, cert, skills, weights, scores, total, position, certSuggest }
    const stmt = db.prepare(`INSERT INTO evaluations
      (name, years, education, cert, skills, weights, scores, total, position, certSuggest, timestamp)
      VALUES (@name,@years,@education,@cert,@skills,@weights,@scores,@total,@position,@certSuggest,@timestamp)`);
    const info = stmt.run({
      name: payload.name,
      years: payload.years,
      education: payload.education,
      cert: payload.cert,
      skills: JSON.stringify(payload.skills||{}),
      weights: JSON.stringify(payload.weights||{}),
      scores: JSON.stringify(payload.scores||{}),
      total: payload.total,
      position: payload.position || decide(payload.total),
      certSuggest: JSON.stringify(payload.certSuggest||[]),
      timestamp: new Date().toISOString()
    });
    const row = db.prepare('SELECT * FROM evaluations WHERE id = ?').get(info.lastInsertRowid);
    res.json(row);
  }catch(err){
    console.error(err);
    res.status(500).json({error:'Failed to save'});
  }
});

app.get('/api/evaluations', (req,res)=>{
  const rows = db.prepare('SELECT * FROM evaluations ORDER BY id DESC LIMIT 200').all();
  // parse JSON fields
  const parsed = rows.map((r:any)=>({
    ...r,
    skills: JSON.parse(r.skills||'{}'),
    weights: JSON.parse(r.weights||'{}'),
    scores: JSON.parse(r.scores||'{}'),
    certSuggest: JSON.parse(r.certSuggest||'[]')
  }));
  res.json(parsed);
});

app.get('/api/stats', (req,res)=>{
  const totalCount = db.prepare('SELECT COUNT(*) as c FROM evaluations').get().c;
  const avgRow = db.prepare('SELECT AVG(total) as avg FROM evaluations').get();
  const avg = avgRow ? Math.round(avgRow.avg || 0) : 0;
  const distRows = db.prepare('SELECT position, COUNT(*) as c FROM evaluations GROUP BY position').all();
  const distribution:any = {};
  distRows.forEach((r:any)=>distribution[r.position] = r.c);
  res.json({totalCount, avg, distribution});
});

const PORT = Number(process.env.PORT || 5181);
app.listen(PORT, ()=>console.log(`Server running on http://localhost:${PORT}`));
