import { Pool } from 'pg';

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
  skills: any;
  weights: any;
  scores: any;
  certSuggest: any;
};

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export function decidePosition(total: number) {
  if (total >= 80) return 'Senior Project Manager';
  if (total >= 60) return 'Project Manager';
  if (total >= 40) return 'Junior Project Manager';
  return 'Not Qualified';
}

export function normalizeEvaluation(row: RawEvaluation): Evaluation {
  return {
    ...row,
    skills: row.skills ?? {},
    weights: row.weights ?? {},
    scores: row.scores ?? {},
    certSuggest: row.certSuggest ?? [],
  };
}