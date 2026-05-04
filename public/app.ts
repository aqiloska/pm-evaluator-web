// Enhanced frontend TypeScript

type Scores = { experience:number; certification:number; skills:number; education:number };

const el = (id:string)=>document.getElementById(id) as HTMLElement;

// sidebar navigation
function showSection(id:string){
  const sections = ['dashboard','evaluations','reports','settings','form','flowchart'];
  sections.forEach(k=>{ const el = document.getElementById(k); if(!el) return; if(k===id) el.classList.remove('hidden'); else el.classList.add('hidden'); });
  const top = document.getElementById('topCards'); if(top) top.classList.toggle('hidden', id !== 'dashboard');
  // update nav active class
  document.querySelectorAll('.nav-list li').forEach(n=>{ const ds = (n as HTMLElement).dataset.section || 'dashboard'; if(ds === id) n.classList.add('active'); else n.classList.remove('active'); });
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.querySelectorAll('.nav-list li').forEach((li)=>{
    li.addEventListener('click', ()=>{
      const section = (li as HTMLElement).dataset.section || 'dashboard';
      showSection(section);
    });
  });
  // show dashboard initially
  showSection('dashboard');
});


function syncWeight(id:string, spanId:string){
  const v = (document.getElementById(id) as HTMLInputElement).value;
  const s = document.getElementById(spanId);
  if(s) s.textContent = v + '%';
}
['w_exp','w_cert','w_skills','w_edu'].forEach(k=>{
  try{ syncWeight(k,k+'_val'); (document.getElementById(k) as HTMLInputElement).addEventListener('input',()=>syncWeight(k,k+'_val')); }catch(e){}
});

function validate(){
  const name = (el('name') as any as HTMLInputElement).value.trim();
  const years = (el('years') as any as HTMLInputElement).value;
  if(!name || years==='') return {ok:false,msg:'Please fill name and years.'};
  return {ok:true};
}

function experienceScore(years:number){ const y = Math.min(20, years); return Math.round((y/20)*100); }
function certScore(cert:string){ if(cert==='PMP') return 100; if(cert==='CAPM') return 70; return 0; }
function educationScore(ed:string){ switch(ed){case 'High School':return 50;case 'Bachelor':return 80;case 'Master':return 90;case 'PhD':return 100;default:return 70} }
function skillsScore(){ const skills = Array.from(document.querySelectorAll('.skill')).map((n:any)=>Number((n as HTMLInputElement).value||0)); const avg = skills.reduce((a,b)=>a+b,0)/skills.length; return Math.round((avg/5)*100); }

function calculateTotal(){
  const wExp = Number((el('w_exp') as any as HTMLInputElement).value);
  const wCert = Number((el('w_cert') as any as HTMLInputElement).value);
  const wSkills = Number((el('w_skills') as any as HTMLInputElement).value);
  const wEdu = Number((el('w_edu') as any as HTMLInputElement).value);
  const sum = wExp+wCert+wSkills+wEdu || 100;
  const norm = (v:number)=>(v/sum)*100;
  const years = Number((el('years') as any as HTMLInputElement).value);
  const ed = ((el('education') as any as HTMLSelectElement).value);
  const cert = ((el('cert') as any as HTMLSelectElement).value);
  const scores:Scores = { experience: experienceScore(years), certification: certScore(cert), skills: skillsScore(), education: educationScore(ed) };
  const total = Math.round(
    scores.experience*norm(wExp)/100 +
    scores.certification*norm(wCert)/100 +
    scores.skills*norm(wSkills)/100 +
    scores.education*norm(wEdu)/100
  );
  return {scores,total};
}

function decide(total:number){ if(total>=80) return 'Senior Project Manager'; if(total>=60) return 'Project Manager'; if(total>=40) return 'Junior Project Manager'; return 'Not Qualified'; }

async function saveEvaluation(payload:any){
  const res = await fetch('/api/evaluations', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  return res.json();
}

async function deleteEvaluation(id:number){
  const res = await fetch(`/api/evaluations/${id}`, {method:'DELETE'});
  return res.json();
}

async function loadStats(){ const r = await fetch('/api/stats'); return r.json(); }
async function loadEvals(){ const r = await fetch('/api/evaluations'); return r.json(); }

let pieChart:any=null, barChart:any=null, lineChart:any=null;

function renderCards(stats:any, latest:any){
  (document.getElementById('totalCount') as HTMLElement).textContent = String(stats.totalCount || 0);
  (document.getElementById('avgScore') as HTMLElement).textContent = String(stats.avg || 0);
  (document.getElementById('recentName') as HTMLElement).textContent = latest && latest.name ? latest.name : '—';
}

function renderLatestList(rows:any[]){
  const ul = document.getElementById('latestList')!; ul.innerHTML='';
  rows.slice(0,6).forEach((r:any)=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${r.name} — ${r.position} (${r.total})</span><div><button data-id="${r.id}" class="btn-delete">Delete</button></div>`;
    ul.appendChild(li);
  });
  document.querySelectorAll('.btn-delete').forEach(b=>b.addEventListener('click', async (ev)=>{
    const id = Number((ev.currentTarget as HTMLElement).getAttribute('data-id'));
    if(!confirm('Delete evaluation?')) return;
    await deleteEvaluation(id); await refreshAll();
  }));
}

function renderEvalTable(rows:any[]){
  const container = document.getElementById('evalTable')!; container.innerHTML='';
  rows.forEach((r:any)=>{
    const div = document.createElement('div'); div.className='table-row';
    div.innerHTML = `<div class="cell"><strong>${r.name}</strong><div style="font-size:12px;color:#6b7280">${r.position} • ${r.total} pts</div></div><div class="actions"><button data-id="${r.id}" class="btn-view">View</button><button data-id="${r.id}" class="btn-delete small">Delete</button></div>`;
    container.appendChild(div);
  });
  container.querySelectorAll('.btn-delete').forEach(b=>b.addEventListener('click', async (ev)=>{ const id = Number((ev.currentTarget as HTMLElement).getAttribute('data-id')); if(!confirm('Delete?')) return; await deleteEvaluation(id); await refreshAll(); }));
}

function drawPie(dist:any){
  const ctx = (document.getElementById('pieChart') as HTMLCanvasElement).getContext('2d')!;
  const labels = Object.keys(dist); const data = Object.values(dist);
  if(pieChart) pieChart.destroy();
  pieChart = new (window as any).Chart(ctx, { type:'pie', data:{labels, datasets:[{data, backgroundColor:['#0b63ff','#1dd1a1','#ffb020','#ff6b6b']} ]}, options:{responsive:true}});
}

function drawBar(avgs:any){
  const ctx = (document.getElementById('barChart') as HTMLCanvasElement).getContext('2d')!;
  const labels = Object.keys(avgs); const data = Object.values(avgs);
  if(barChart) barChart.destroy();
  barChart = new (window as any).Chart(ctx, { type:'bar', data:{labels, datasets:[{label:'Average', data, backgroundColor:'#0b63ff'}]}, options:{responsive:true, maintainAspectRatio:true}});
}

function drawLine(times:any[], totals:any[]){
  const ctx = (document.getElementById('lineChart') as HTMLCanvasElement).getContext('2d')!;
  if(lineChart) lineChart.destroy();
  lineChart = new (window as any).Chart(ctx, { type:'line', data:{labels:times, datasets:[{label:'Total Score',data:totals,borderColor:'#0b63ff',fill:false}]}, options:{responsive:true}});
}

async function refreshAll(){
  try{
    const [stats, evals] = await Promise.all([loadStats(), loadEvals()]);
    const latest = evals[0] || null;
    renderCards(stats, latest);
    renderLatestList(evals);
    renderEvalTable(evals);
    drawPie(stats.distribution || {});
    // compute average criteria across evaluations
    const sum:{[k:string]:number} = {experience:0,certification:0,skills:0,education:0}; let c=0; const times:string[]=[]; const totals:number[]=[];
    evals.slice().reverse().forEach((e:any)=>{ const s = e.scores || {}; sum.experience += s.experience||0; sum.certification += s.certification||0; sum.skills += s.skills||0; sum.education += s.education||0; c++; times.push((new Date(e.timestamp)).toLocaleDateString()); totals.push(e.total); });
    const avgs = c?{Experience:Math.round(sum.experience/c), Certification:Math.round(sum.certification/c), Skills:Math.round(sum.skills/c), Education:Math.round(sum.education/c)}:{Experience:0,Certification:0,Skills:0,Education:0};
    drawBar(avgs); drawLine(times, totals);
  }catch(e){console.warn('refresh failed',e)}
}

document.getElementById('refreshBtn')!.addEventListener('click',()=>refreshAll());

(document.getElementById('scoreBtn') as HTMLButtonElement).addEventListener('click', async ()=>{
  const v = validate(); if(!v.ok){ alert(v.msg); return; }
  const name = (document.getElementById('name') as any as HTMLInputElement).value.trim();
  const years = Number((document.getElementById('years') as any as HTMLInputElement).value);
  const education = (document.getElementById('education') as any as HTMLSelectElement).value;
  const cert = (document.getElementById('cert') as any as HTMLSelectElement).value;
  const skillsNodes = Array.from(document.querySelectorAll('.skill')) as any[]; const skills:any = {};
  skillsNodes.forEach(n=>skills[n.dataset.skill]=Number((n as HTMLInputElement).value||0));
  const weights = { exp: Number((document.getElementById('w_exp') as any as HTMLInputElement).value), cert: Number((document.getElementById('w_cert') as any as HTMLInputElement).value), skills: Number((document.getElementById('w_skills') as any as HTMLInputElement).value), edu: Number((document.getElementById('w_edu') as any as HTMLInputElement).value) };
  const calc = calculateTotal(); const position = decide(calc.total);
  const certSuggest = (cert==='None' || calc.scores.certification<60) ? ['PMP','CAPM'] : [];
  const payload = { name, years, education, cert, skills, weights, scores: calc.scores, total: calc.total, position, certSuggest };
  const saved = await saveEvaluation(payload);
  alert('Saved: ' + saved.name + ' • Score: ' + saved.total);
  await refreshAll();
});

(document.getElementById('exportBtn') as HTMLButtonElement).addEventListener('click', ()=>{
  const latest = localStorage.getItem('pm_latest'); if(!latest){ alert('No latest result to export'); return; }
  const blob = new Blob([latest], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='evaluation.json'; document.body.appendChild(a); a.click(); a.remove();
});

(document.getElementById('validateBtn') as HTMLButtonElement).addEventListener('click', ()=>{ const v = validate(); if(!v.ok) alert(v.msg); else alert('Validation passed'); });

(document.getElementById('resetBtn') as HTMLButtonElement).addEventListener('click', ()=>{ if(!confirm('Reset?')) return; (document.getElementById('name') as any).value=''; (document.getElementById('years') as any).value='3'; (document.getElementById('education') as any).value='Master'; (document.getElementById('cert') as any).value='None'; document.querySelectorAll('.skill').forEach((n:any)=>n.value='0'); ['w_exp','w_cert','w_skills','w_edu'].forEach(k=>{ (document.getElementById(k) as any).value = (k==='w_exp'?40:(k==='w_cert'?30:(k==='w_skills'?20:10))); syncWeight(k,k+'_val'); });
});

// initial load
refreshAll();
