import Database from 'better-sqlite3';
import path from 'path';

export type Evaluation = {
  id: number;
  name: string;
  years: number;
  education: string;
  cert: string;
  skills: Record<string, number>;
  weights: Record<string, number>;
  scores: Record<string, number>;
  total: number;
  position: string;
  certSuggest: string[];
  timestamp: string;
};

type RawEvaluation = Omit<Evaluation, 'skills' | 'weights' | 'scores' | 'certSuggest'> & {
  skills: string;
  weights: string;
  scores: string;
  certSuggest: string;
};

const dbPath = path.join(process.cwd(), 'pm-evaluator.db');
const db = new Database(dbPath);

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

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function decidePosition(total: number) {
  if (total >= 80) return 'Senior Project Manager';
  if (total >= 60) return 'Project Manager';
  if (total >= 40) return 'Junior Project Manager';
  return 'Not Qualified';
}

export function normalizeEvaluation(row: RawEvaluation): Evaluation {
  return {
    ...row,
    skills: parseJson(row.skills, {}),
    weights: parseJson(row.weights, {}),
    scores: parseJson(row.scores, {}),
    certSuggest: parseJson(row.certSuggest, []),
  };
}

export default db;
