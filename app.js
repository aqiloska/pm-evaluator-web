// Core logic for PM evaluation
const el = id=>document.getElementById(id);

function syncWeight(id, spanId){
  const v=el(id).value; el(spanId).textContent = v+"%";
}
["w_exp","w_cert","w_skills","w_edu"].forEach(k=>{
  const span = k+"_val";
  syncWeight(k, span);
  el(k).addEventListener('input',()=>syncWeight(k, k+"_val"));
});

function validate(){
  const name = el('name').value.trim();
  const years = el('years').value;
  if(!name || years==="" || Number(years)<0) return {ok:false,msg:'Please fill name and valid years.'};
  return {ok:true};
}

function educationScore(ed){
  switch(ed){case 'High School':return 50;case 'Bachelor':return 80;case 'Master':return 90;case 'PhD':return 100;default:return 70}
}
function certScore(cert){
  if(cert==='PMP')return 100; if(cert==='CAPM')return 70; return 0;
}
function experienceScore(years){
  // Normalize 0-20+ years to 0-100
  const y=Math.min(20,Number(years)); return Math.round((y/20)*100);
}
function skillsScore(){
  const skills = Array.from(document.querySelectorAll('.skill')).map(i=>Number(i.value)||0);
  const avg = skills.reduce((a,b)=>a+b,0)/skills.length; // 0-5
  return Math.round((avg/5)*100);
}

function calculateTotal(){
  const wExp = Number(el('w_exp').value);
  const wCert = Number(el('w_cert').value);
  const wSkills = Number(el('w_skills').value);
  const wEdu = Number(el('w_edu').value);
  const sum = wExp+wCert+wSkills+wEdu || 100;
  // normalize weights to sum 100
  const norm = v=> (v/sum)*100;
  const years = el('years').value;
  const ed = el('education').value;
  const cert = el('cert').value;
  const scores = {
    experience: experienceScore(years),
    certification: certScore(cert),
    skills: skillsScore(),
    education: educationScore(ed)
  };
  const total = Math.round(
    scores.experience*norm(wExp)/100 +
    scores.certification*norm(wCert)/100 +
    scores.skills*norm(wSkills)/100 +
    scores.education*norm(wEdu)/100
  );
  return {scores,total};
}

function decide(total){
  if(total>=80) return 'Senior Project Manager';
  if(total>=60) return 'Project Manager';
  if(total>=40) return 'Junior Project Manager';
  return 'Not Qualified';
}

function certRecommendation(cert, certScoreVal){
  if(cert==='None' || certScoreVal<60) return ['PMP','CAPM'];
  return [];
}

function renderOutput(result){
  const out = el('outCard'); out.classList.remove('empty'); out.innerHTML='';
  const card = document.createElement('div');
  card.innerHTML = `
    <div class="out-row"><strong>Candidate:</strong><span>${result.name}</span></div>
    <div class="out-row"><strong>Total Score:</strong><span>${result.total}</span></div>
    <div class="out-row"><strong>Recommended Position:</strong><span>${result.position}</span></div>
    <div class="out-row"><strong>Certification Suggestion:</strong><span>${result.certSuggest.join(', ')||'None'}</span></div>
    <hr>
    <div><strong>Breakdown</strong></div>
    <div class="out-row"><span>Experience</span><span>${result.scores.experience}</span></div>
    <div class="out-row"><span>Certification</span><span>${result.scores.certification}</span></div>
    <div class="out-row"><span>Skills</span><span>${result.scores.skills}</span></div>
    <div class="out-row"><span>Education</span><span>${result.scores.education}</span></div>
  `;
  out.appendChild(card);
}

el('validateBtn').addEventListener('click',()=>{
  const v=validate();
  if(!v.ok) alert(v.msg); else alert('Validation passed — data looks complete.');
});

el('scoreBtn').addEventListener('click',()=>{
  const v=validate(); if(!v.ok){alert(v.msg);return}
  const name = el('name').value.trim();
  const calc = calculateTotal();
  const position = decide(calc.total);
  const certSuggest = certRecommendation(el('cert').value, calc.scores.certification);
  const result = {name, scores:calc.scores, total:calc.total, position, certSuggest, timestamp:new Date().toISOString()};
  renderOutput(result);
  // keep latest in memory
  window.latestEval = result;
});

el('saveBtn').addEventListener('click',()=>{
  if(!window.latestEval){alert('No result to save. Run calculation first.');return}
  const key = 'pm_eval_'+(new Date()).getTime();
  localStorage.setItem(key, JSON.stringify(window.latestEval));
  alert('Saved to browser storage as '+key);
});

el('exportBtn').addEventListener('click',()=>{
  if(!window.latestEval){alert('No result to export. Run calculation first.');return}
  const data = JSON.stringify(window.latestEval, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download = (window.latestEval.name||'candidate')+'_evaluation.json'; document.body.appendChild(a); a.click(); a.remove();
});

el('resetBtn').addEventListener('click',()=>{
  if(!confirm('Reset form to defaults?'))return;
  el('candidateForm').reset();
  ['w_exp','w_cert','w_skills','w_edu'].forEach(k=>syncWeight(k,k+"_val"));
  document.querySelector('#outCard').classList.add('empty'); document.querySelector('#outCard').innerHTML='<p class="emptyTxt">No result yet — validate and calculate to see evaluation.</p>';
  window.latestEval=null;
});

// Small helper to set default output card
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelector('#outCard').classList.add('empty');
});
