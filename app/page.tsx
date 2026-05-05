'use client';

// import { useEffect, useMemo, useState } from 'react';
import { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';

type Scores = {
  experience: number;
  certification: number;
  skills: number;
  education: number;
};

type Evaluation = {
  id: number;
  name: string;
  years: number;
  education: string;
  cert: string;
  skills: Record<string, number>;
  weights: Record<string, number>;
  scores: Scores;
  total: number;
  position: string;
  certSuggest: string[];
  timestamp: string;
};

type Stats = {
  totalCount: number;
  avg: number;
  distribution: Record<string, number>;
};

const sections = ['dashboard', 'form', 'evaluations', 'reports', 'settings', 'flowchart'] as const;
type Section = (typeof sections)[number];

const navItems: { id: Section; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'form', label: 'New Evaluation' },
  { id: 'evaluations', label: 'Evaluations' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
  { id: 'flowchart', label: 'Flowchart' },
];

const defaultSkills = {
  leadership: 4,
  risk: 3,
  cost: 3,
  comm: 4,
};

const defaultWeights = {
  exp: 40,
  cert: 30,
  skills: 20,
  edu: 10,
};

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Request failed: ${response.status}`);
  }
  return data;
}

function experienceScore(years: number) {
  return Math.round((Math.min(20, years) / 20) * 100);
}

function certScore(cert: string) {
  if (cert === 'PMP') return 100;
  if (cert === 'CAPM') return 70;
  return 0;
}

function educationScore(education: string) {
  if (education === 'High School') return 50;
  if (education === 'Bachelor') return 80;
  if (education === 'Master') return 90;
  if (education === 'PhD') return 100;
  return 70;
}

function decidePosition(total: number) {
  if (total >= 80) return 'Senior Project Manager';
  if (total >= 60) return 'Project Manager';
  if (total >= 40) return 'Junior Project Manager';
  return 'Not Qualified';
}

// function downloadJson(filename: string, data: unknown) {
//   const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
//   const url = URL.createObjectURL(blob);
//   const link = document.createElement('a');
//   link.href = url;
//   link.download = filename;
//   document.body.appendChild(link);
//   link.click();
//   link.remove();
//   URL.revokeObjectURL(url);
// }

// function downloadPDF(filename: string, data: any) {
//   const doc = new jsPDF();

//   let y = 10;

//   doc.setFontSize(16);
//   doc.text("PM Evaluator Report", 10, y);
//   y += 10;

//   doc.setFontSize(10);
//   doc.text(`Generated: ${new Date().toLocaleString()}`, 10, y);
//   y += 10;

//   // Stats
//   doc.text(`Total Evaluations: ${data.stats.totalCount}`, 10, y);
//   y += 6;
//   doc.text(`Average Score: ${data.stats.avg}`, 10, y);
//   y += 10;

//   // Evaluations
//   doc.setFontSize(12);
//   doc.text("Evaluations:", 10, y);
//   y += 8;

//   data.evaluations.forEach((ev: any, index: number) => {
//     if (y > 270) {
//       doc.addPage();
//       y = 10;
//     }

//     doc.setFontSize(10);
//     doc.text(`${index + 1}. ${ev.name}`, 10, y);
//     y += 5;

//     doc.text(`Score: ${ev.total} | Position: ${ev.position}`, 10, y);
//     y += 5;

//     doc.text(`Experience: ${ev.years} years`, 10, y);
//     y += 8;
//   });

//   doc.save(filename);
// }

function downloadPDF(filename: string, data: any) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // HEADER
  doc.setFillColor(21, 94, 239);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text("PM Evaluator Report", 14, 18);

  doc.setFontSize(10);
  doc.text("Professional Candidate Assessment", 14, 24);

  doc.setTextColor(0, 0, 0);
  y = 40;

  // SUMMARY BOX
  doc.setDrawColor(200);
  doc.rect(14, y, pageWidth - 28, 30);

  doc.setFontSize(12);
  doc.text("Executive Summary", 16, y + 8);

  doc.setFontSize(10);
  doc.text(`Total Evaluations: ${data.stats.totalCount}`, 16, y + 16);
  doc.text(`Average Score: ${data.stats.avg}`, 16, y + 22);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 110, y + 16);

  y += 40;

  // TABLE HEADER
  doc.setFillColor(240, 240, 240);
  doc.rect(14, y, pageWidth - 28, 8, "F");

  doc.setFontSize(11);
  doc.text("No", 16, y + 6);
  doc.text("Name", 30, y + 6);
  doc.text("Score", 90, y + 6);
  doc.text("Position", 115, y + 6);
  doc.text("Exp", 165, y + 6);

  y += 10;

  // TABLE DATA
  data.evaluations.forEach((ev: any, index: number) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(14, y - 4, pageWidth - 28, 8, "F");
    }

    doc.setFontSize(10);
    doc.text(String(index + 1), 16, y);
    doc.text(ev.name || "-", 30, y);
    doc.text(String(ev.total), 90, y);
    doc.text(ev.position || "-", 115, y);
    doc.text(`${ev.years} yrs`, 165, y);

    y += 8;
  });

  y += 10;

  // DETAIL SECTION
  doc.setFontSize(12);
  doc.text("Top Candidates Detail", 14, y);
  y += 8;

  data.evaluations.slice(0, 3).forEach((ev: any) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setDrawColor(220);
    doc.rect(14, y, pageWidth - 28, 28);

    doc.setFontSize(11);
    doc.text(`Name: ${ev.name}`, 16, y + 8);

    doc.setFontSize(10);
    doc.text(`Score: ${ev.total}`, 16, y + 14);
    doc.text(`Position: ${ev.position}`, 16, y + 20);

    doc.text(`Experience: ${ev.years} yrs`, 100, y + 14);
    doc.text(`Education: ${ev.education}`, 100, y + 20);

    y += 34;
  });

  // FOOTER
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, 290);
  }

  doc.save(filename);
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 truncate text-3xl font-bold text-ink">{value}</p>
    </div>
  );
}

function BarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  const display: [string, number][] = entries.length ? entries : [['No data', 0]];
  const max = Math.max(1, ...display.map(([, value]) => value));

  return (
    <div className="space-y-4">
      {display.map(([label, value]) => (
        <div key={label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{label}</span>
            <span className="text-slate-500">{value}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div
              className="h-3 rounded-full bg-brand"
              style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, value]) => value > 0);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const colors = ['#155EEF', '#12B76A', '#F79009', '#F04438', '#7A5AF8'];
  let cumulative = 0;

  if (!entries.length || total === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        No distribution data yet
      </div>
    );
  }

  return (
    <div className="grid items-center gap-6 md:grid-cols-[220px_1fr]">
      <div
        className="relative mx-auto h-52 w-52 rounded-full"
        style={{
          background: `conic-gradient(${entries
            .map(([label, value], index) => {
              const start = (cumulative / total) * 100;
              cumulative += value;
              const end = (cumulative / total) * 100;
              return `${colors[index % colors.length]} ${start}% ${end}%`;
            })
            .join(', ')})`,
        }}
        aria-label="Position distribution chart"
      >
        <div className="absolute inset-10 flex flex-col items-center justify-center rounded-full bg-white text-center shadow-inner">
          <span className="text-3xl font-bold text-ink">{total}</span>
          <span className="text-xs font-medium text-slate-500">evaluations</span>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map(([label, value], index) => (
          <div key={label} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
              <span className="truncate font-medium text-slate-700">{label}</span>
            </div>
            <span className="font-semibold text-slate-900">{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart({ evaluations }: { evaluations: Evaluation[] }) {
  const data = evaluations.slice().reverse();
  const width = 720;
  const height = 260;
  const padding = 34;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
        Save evaluations to generate a score trend
      </div>
    );
  }

  const points = data.map((evaluation, index) => {
    const x = data.length === 1 ? width / 2 : padding + (index / (data.length - 1)) * plotWidth;
    const y = padding + (1 - Math.min(100, Math.max(0, evaluation.total)) / 100) * plotHeight;
    return { x, y, evaluation };
  });
  const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-72 w-full">
        <defs>
          <linearGradient id="scoreArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#155EEF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#155EEF" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 25, 50, 75, 100].map((value) => {
          const y = padding + (1 - value / 100) * plotHeight;
          return (
            <g key={value}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} stroke="#E2E8F0" strokeWidth="1" />
              <text x={8} y={y + 4} className="fill-slate-400 text-[11px]">
                {value}
              </text>
            </g>
          );
        })}
        <path d={areaPath} fill="url(#scoreArea)" />
        <path d={path} fill="none" stroke="#155EEF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {points.map(({ x, y, evaluation }) => (
          <g key={evaluation.id}>
            <circle cx={x} cy={y} r="5" fill="#155EEF" stroke="white" strokeWidth="3" />
            <title>{`${evaluation.name}: ${evaluation.total}`}</title>
          </g>
        ))}
      </svg>
      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 p-4 text-sm">
        <div>
          <p className="text-slate-500">Highest</p>
          <p className="font-semibold text-ink">{Math.max(...data.map((evaluation) => evaluation.total))}</p>
        </div>
        <div>
          <p className="text-slate-500">Lowest</p>
          <p className="font-semibold text-ink">{Math.min(...data.map((evaluation) => evaluation.total))}</p>
        </div>
        <div>
          <p className="text-slate-500">Latest</p>
          <p className="font-semibold text-ink">{data[data.length - 1].total}</p>
        </div>
      </div>
    </div>
  );
}

function CriteriaChart({ evaluations }: { evaluations: Evaluation[] }) {
  const averages = useMemo(() => {
    if (!evaluations.length) {
      return { Experience: 0, Certification: 0, Skills: 0, Education: 0 };
    }

    const total = evaluations.reduce(
      (sum, evaluation) => ({
        Experience: sum.Experience + (evaluation.scores?.experience || 0),
        Certification: sum.Certification + (evaluation.scores?.certification || 0),
        Skills: sum.Skills + (evaluation.scores?.skills || 0),
        Education: sum.Education + (evaluation.scores?.education || 0),
      }),
      { Experience: 0, Certification: 0, Skills: 0, Education: 0 },
    );

    return Object.fromEntries(
      Object.entries(total).map(([key, value]) => [key, Math.round(value / evaluations.length)]),
    ) as Record<string, number>;
  }, [evaluations]);

  return <BarChart data={averages} />;
}

export default function Page() {
  const [active, setActive] = useState<Section>('dashboard');
  const [stats, setStats] = useState<Stats>({ totalCount: 0, avg: 0, distribution: {} });
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [years, setYears] = useState(3);
  const [education, setEducation] = useState('Master');
  const [cert, setCert] = useState('None');
  const [skills, setSkills] = useState(defaultSkills);
  const [weights, setWeights] = useState(defaultWeights);

  const latest = evaluations[0] || null;

  async function refreshAll() {
    try {
      setLoading(true);
      setError('');
      const [nextStats, nextEvaluations] = await Promise.all([
        requestJson<Stats>('/api/stats'),
        requestJson<Evaluation[]>('/api/evaluations'),
      ]);
      setStats(nextStats);
      setEvaluations(nextEvaluations);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAll();
  }, []);

  function calculateTotal() {
    const sum = weights.exp + weights.cert + weights.skills + weights.edu || 100;
    const skillValues = Object.values(skills);
    const skillAverage = skillValues.reduce((total, value) => total + value, 0) / skillValues.length;
    const scores: Scores = {
      experience: experienceScore(years),
      certification: certScore(cert),
      skills: Math.round((skillAverage / 5) * 100),
      education: educationScore(education),
    };
    const total = Math.round(
      scores.experience * (weights.exp / sum) +
        scores.certification * (weights.cert / sum) +
        scores.skills * (weights.skills / sum) +
        scores.education * (weights.edu / sum),
    );

    return { scores, total };
  }

  async function saveEvaluation() {
    if (!name.trim()) {
      alert('Please fill name and years.');
      return;
    }

    try {
      const calculation = calculateTotal();
      const payload = {
        name: name.trim(),
        years,
        education,
        cert,
        skills,
        weights,
        scores: calculation.scores,
        total: calculation.total,
        position: decidePosition(calculation.total),
        certSuggest: cert === 'None' || calculation.scores.certification < 60 ? ['PMP', 'CAPM'] : [],
      };
      const saved = await requestJson<Evaluation>('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      localStorage.setItem('pm_latest', JSON.stringify(saved, null, 2));
      await refreshAll();
      alert(`Saved: ${saved.name} - Score: ${saved.total}`);
    } catch (err: any) {
      alert(err.message || 'Failed to save evaluation');
    }
  }

  async function deleteEvaluation(id: number) {
    if (!confirm('Delete evaluation?')) return;
    await requestJson(`/api/evaluations/${id}`, { method: 'DELETE' });
    await refreshAll();
  }

  function resetForm() {
    setName('');
    setYears(3);
    setEducation('Master');
    setCert('None');
    setSkills(defaultSkills);
    setWeights(defaultWeights);
  }

  const trend = evaluations.slice().reverse();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-white">
        <div className="flex h-full flex-col px-5 py-6">
          <div className="border-b border-slate-200 pb-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Decision Support</p>
            <h1 className="mt-2 text-xl font-bold leading-tight text-ink">Project Manager Evaluator</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Selection and evaluation framework for Malaysia.</p>
          </div>

          <nav className="mt-6">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActive(item.id)}
                    className={`w-full rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                      active === item.id
                        ? 'bg-blue-50 text-brand'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <section className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">Evaluation Flow</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Input candidate data, validate criteria, calculate weighted score, decide position,
              recommend certification, then save the result.
            </p>
          </section>

          <footer className="mt-auto pt-6 text-xs text-slate-500">Research and evaluation system</footer>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand">PM selection dashboard</p>
            <h2 className="mt-1 text-2xl font-bold tracking-normal text-ink">Candidate Evaluation Workspace</h2>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </header>

        {error ? (
          <div className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        {active === 'dashboard' ? (
          <>
            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard label="Total Evaluations" value={stats.totalCount} />
              <MetricCard label="Average Score" value={stats.avg} />
              <MetricCard label="Most Recent" value={latest?.name || 'None'} />
            </section>

            <section className="mt-6 grid gap-4 xl:grid-cols-[2fr_1fr]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-ink">Position Distribution</h3>
                  <div className="mt-5">
                    <DonutChart data={stats.distribution} />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-ink">Average Criteria Scores</h3>
                  <div className="mt-5">
                    <CriteriaChart evaluations={evaluations} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-ink">Score Over Time</h3>
                  <div className="mt-5">
                    <LineChart evaluations={evaluations} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-base font-semibold text-ink">Latest Evaluations</h3>
                  <EvaluationList evaluations={evaluations.slice(0, 6)} onDelete={deleteEvaluation} />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {active === 'form' ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-lg font-semibold text-ink">New Candidate Evaluation</h2>
              <p className="mt-1 text-sm text-slate-500">Enter candidate criteria and calculate the recommended project management role.</p>
            </div>

            <form className="mt-5 space-y-6" onSubmit={(event) => event.preventDefault()}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Name">
                  <input value={name} onChange={(event) => setName(event.target.value)} className="field" required />
                </Field>
                <Field label="Years">
                  <input type="number" min={0} max={50} value={years} onChange={(event) => setYears(Number(event.target.value))} className="field" />
                </Field>
                <Field label="Education">
                  <select value={education} onChange={(event) => setEducation(event.target.value)} className="field">
                    <option>High School</option>
                    <option>Bachelor</option>
                    <option>Master</option>
                    <option>PhD</option>
                  </select>
                </Field>
                <Field label="Certification">
                  <select value={cert} onChange={(event) => setCert(event.target.value)} className="field">
                    <option>None</option>
                    <option>CAPM</option>
                    <option>PMP</option>
                  </select>
                </Field>
              </div>

              <FormSection title="Skills">
                {[
                  ['leadership', 'Leadership'],
                  ['risk', 'Risk Management'],
                  ['cost', 'Cost Control'],
                  ['comm', 'Communication'],
                ].map(([key, label]) => (
                  <Field key={key} label={label}>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={skills[key as keyof typeof skills]}
                      onChange={(event) => setSkills({ ...skills, [key]: Number(event.target.value) })}
                      className="field"
                    />
                  </Field>
                ))}
              </FormSection>

              <FormSection title="Criteria Weights">
                {[
                  ['exp', 'Experience'],
                  ['cert', 'Certification'],
                  ['skills', 'Skills'],
                  ['edu', 'Education'],
                ].map(([key, label]) => (
                  <label key={key} className="block text-sm font-medium text-slate-700">
                    {label}
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={weights[key as keyof typeof weights]}
                      onChange={(event) => setWeights({ ...weights, [key]: Number(event.target.value) })}
                      className="mt-3 w-full accent-blue-600"
                    />
                    <span className="mt-1 block text-xs font-semibold text-brand">{weights[key as keyof typeof weights]}%</span>
                  </label>
                ))}
              </FormSection>

              <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={() => alert(name.trim() ? 'Validation passed' : 'Please fill name and years.')} className="secondary-button">
                  Validate
                </button>
                <button type="button" onClick={saveEvaluation} className="primary-button">
                  Calculate and Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const latestJson = localStorage.getItem('pm_latest');
                    if (!latestJson) alert('No latest result to export');
                    // else downloadJson('evaluation.json', JSON.parse(latestJson));
                    else downloadPDF('evaluation.pdf', {
                    stats,
                    evaluations: [JSON.parse(latestJson)]
                  });
                  }}
                  className="secondary-button"
                >
                  Export Latest JSON
                </button>
                <button type="button" onClick={resetForm} className="secondary-button">
                  Reset
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {active === 'evaluations' ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Saved Evaluations</h2>
            <EvaluationList evaluations={evaluations} onDelete={deleteEvaluation} />
          </section>
        ) : null}

        {active === 'reports' ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Reports</h2>
            <p className="mt-2 text-sm text-slate-600">Export all saved evaluations and dashboard statistics as PDF.</p>
            <button
              type="button"
              // onClick={() => downloadJson('pm-evaluator-report.json', { generatedAt: new Date().toISOString(), stats, evaluations })}
              onClick={() =>
              downloadPDF('pm-evaluator-report.pdf', {
                stats,
                evaluations
              })
            }
              className="primary-button mt-4"
            >
              Save Report PDF
            </button>
          </section>
        ) : null}

        {active === 'settings' ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">Settings</h2>
            <p className="mt-2 text-sm text-slate-600">Default scoring weights are controlled in the evaluation form.</p>
          </section>
        ) : null}

        {active === 'flowchart' ? (
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-ink">System Flowchart</h2>
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
              <ol className="grid gap-3 text-sm text-slate-700 md:grid-cols-2">
                {[
                  'Input candidate data',
                  'Validate required information',
                  'Score experience, certification, skills, and education',
                  'Normalize criteria weights',
                  'Calculate weighted total score',
                  'Decide recommended position',
                  'Suggest certification when needed',
                  'Save evaluation and update dashboard',
                ].map((step, index) => (
                  <li key={step} className="rounded-md border border-slate-200 bg-white p-3">
                    <span className="font-semibold text-brand">{index + 1}.</span> {step}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>
    </div>
  );
}

function EvaluationList({
  evaluations,
  onDelete,
}: {
  evaluations: Evaluation[];
  onDelete: (id: number) => void;
}) {
  if (!evaluations.length) {
    return <p className="mt-4 text-sm text-slate-500">No evaluations saved yet.</p>;
  }

  return (
    <div className="mt-4 divide-y divide-slate-100">
      {evaluations.map((evaluation) => (
        <div key={evaluation.id} className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{evaluation.name || 'Unnamed candidate'}</p>
            <p className="text-xs text-slate-500">
              {evaluation.position || 'No position'} - {evaluation.total || 0} pts
            </p>
          </div>
          <button
            type="button"
            onClick={() => onDelete(evaluation.id)}
            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
