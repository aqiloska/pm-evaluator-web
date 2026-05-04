(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // public/app.ts
  var require_app = __commonJS({
    "public/app.ts"() {
      var el = (id) => document.getElementById(id);
      function showSection(id) {
        const sections = ["dashboard", "evaluations", "reports", "settings", "form", "flowchart"];
        sections.forEach((k) => {
          const el2 = document.getElementById(k);
          if (!el2) return;
          if (k === id) el2.classList.remove("hidden");
          else el2.classList.add("hidden");
        });
        const top = document.getElementById("topCards");
        if (top) top.classList.toggle("hidden", id !== "dashboard");
        document.querySelectorAll(".nav-list li").forEach((n) => {
          const ds = n.dataset.section || "dashboard";
          if (ds === id) n.classList.add("active");
          else n.classList.remove("active");
        });
      }
      document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll(".nav-list li").forEach((li) => {
          li.addEventListener("click", () => {
            const section = li.dataset.section || "dashboard";
            showSection(section);
          });
        });
        showSection("dashboard");
      });
      function syncWeight(id, spanId) {
        const v = document.getElementById(id).value;
        const s = document.getElementById(spanId);
        if (s) s.textContent = v + "%";
      }
      ["w_exp", "w_cert", "w_skills", "w_edu"].forEach((k) => {
        try {
          syncWeight(k, k + "_val");
          document.getElementById(k).addEventListener("input", () => syncWeight(k, k + "_val"));
        } catch (e) {
        }
      });
      function validate() {
        const name = el("name").value.trim();
        const years = el("years").value;
        if (!name || years === "") return { ok: false, msg: "Please fill name and years." };
        return { ok: true };
      }
      function experienceScore(years) {
        const y = Math.min(20, years);
        return Math.round(y / 20 * 100);
      }
      function certScore(cert) {
        if (cert === "PMP") return 100;
        if (cert === "CAPM") return 70;
        return 0;
      }
      function educationScore(ed) {
        switch (ed) {
          case "High School":
            return 50;
          case "Bachelor":
            return 80;
          case "Master":
            return 90;
          case "PhD":
            return 100;
          default:
            return 70;
        }
      }
      function skillsScore() {
        const skills = Array.from(document.querySelectorAll(".skill")).map((n) => Number(n.value || 0));
        const avg = skills.reduce((a, b) => a + b, 0) / skills.length;
        return Math.round(avg / 5 * 100);
      }
      function calculateTotal() {
        const wExp = Number(el("w_exp").value);
        const wCert = Number(el("w_cert").value);
        const wSkills = Number(el("w_skills").value);
        const wEdu = Number(el("w_edu").value);
        const sum = wExp + wCert + wSkills + wEdu || 100;
        const norm = (v) => v / sum * 100;
        const years = Number(el("years").value);
        const ed = el("education").value;
        const cert = el("cert").value;
        const scores = { experience: experienceScore(years), certification: certScore(cert), skills: skillsScore(), education: educationScore(ed) };
        const total = Math.round(
          scores.experience * norm(wExp) / 100 + scores.certification * norm(wCert) / 100 + scores.skills * norm(wSkills) / 100 + scores.education * norm(wEdu) / 100
        );
        return { scores, total };
      }
      function decide(total) {
        if (total >= 80) return "Senior Project Manager";
        if (total >= 60) return "Project Manager";
        if (total >= 40) return "Junior Project Manager";
        return "Not Qualified";
      }
      async function saveEvaluation(payload) {
        const res = await fetch("/api/evaluations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        return res.json();
      }
      async function deleteEvaluation(id) {
        const res = await fetch(`/api/evaluations/${id}`, { method: "DELETE" });
        return res.json();
      }
      async function loadStats() {
        const r = await fetch("/api/stats");
        return r.json();
      }
      async function loadEvals() {
        const r = await fetch("/api/evaluations");
        return r.json();
      }
      var pieChart = null;
      var barChart = null;
      var lineChart = null;
      function renderCards(stats, latest) {
        document.getElementById("totalCount").textContent = String(stats.totalCount || 0);
        document.getElementById("avgScore").textContent = String(stats.avg || 0);
        document.getElementById("recentName").textContent = latest && latest.name ? latest.name : "\u2014";
      }
      function renderLatestList(rows) {
        const ul = document.getElementById("latestList");
        ul.innerHTML = "";
        rows.slice(0, 6).forEach((r) => {
          const li = document.createElement("li");
          li.innerHTML = `<span>${r.name} \u2014 ${r.position} (${r.total})</span><div><button data-id="${r.id}" class="btn-delete">Delete</button></div>`;
          ul.appendChild(li);
        });
        document.querySelectorAll(".btn-delete").forEach((b) => b.addEventListener("click", async (ev) => {
          const id = Number(ev.currentTarget.getAttribute("data-id"));
          if (!confirm("Delete evaluation?")) return;
          await deleteEvaluation(id);
          await refreshAll();
        }));
      }
      function renderEvalTable(rows) {
        const container = document.getElementById("evalTable");
        container.innerHTML = "";
        rows.forEach((r) => {
          const div = document.createElement("div");
          div.className = "table-row";
          div.innerHTML = `<div class="cell"><strong>${r.name}</strong><div style="font-size:12px;color:#6b7280">${r.position} \u2022 ${r.total} pts</div></div><div class="actions"><button data-id="${r.id}" class="btn-view">View</button><button data-id="${r.id}" class="btn-delete small">Delete</button></div>`;
          container.appendChild(div);
        });
        container.querySelectorAll(".btn-delete").forEach((b) => b.addEventListener("click", async (ev) => {
          const id = Number(ev.currentTarget.getAttribute("data-id"));
          if (!confirm("Delete?")) return;
          await deleteEvaluation(id);
          await refreshAll();
        }));
      }
      function drawPie(dist) {
        const ctx = document.getElementById("pieChart").getContext("2d");
        const labels = Object.keys(dist);
        const data = Object.values(dist);
        if (pieChart) pieChart.destroy();
        pieChart = new window.Chart(ctx, { type: "pie", data: { labels, datasets: [{ data, backgroundColor: ["#0b63ff", "#1dd1a1", "#ffb020", "#ff6b6b"] }] }, options: { responsive: true } });
      }
      function drawBar(avgs) {
        const ctx = document.getElementById("barChart").getContext("2d");
        const labels = Object.keys(avgs);
        const data = Object.values(avgs);
        if (barChart) barChart.destroy();
        barChart = new window.Chart(ctx, { type: "bar", data: { labels, datasets: [{ label: "Average", data, backgroundColor: "#0b63ff" }] }, options: { responsive: true, maintainAspectRatio: true } });
      }
      function drawLine(times, totals) {
        const ctx = document.getElementById("lineChart").getContext("2d");
        if (lineChart) lineChart.destroy();
        lineChart = new window.Chart(ctx, { type: "line", data: { labels: times, datasets: [{ label: "Total Score", data: totals, borderColor: "#0b63ff", fill: false }] }, options: { responsive: true } });
      }
      async function refreshAll() {
        try {
          const [stats, evals] = await Promise.all([loadStats(), loadEvals()]);
          const latest = evals[0] || null;
          renderCards(stats, latest);
          renderLatestList(evals);
          renderEvalTable(evals);
          drawPie(stats.distribution || {});
          const sum = { experience: 0, certification: 0, skills: 0, education: 0 };
          let c = 0;
          const times = [];
          const totals = [];
          evals.slice().reverse().forEach((e) => {
            const s = e.scores || {};
            sum.experience += s.experience || 0;
            sum.certification += s.certification || 0;
            sum.skills += s.skills || 0;
            sum.education += s.education || 0;
            c++;
            times.push(new Date(e.timestamp).toLocaleDateString());
            totals.push(e.total);
          });
          const avgs = c ? { Experience: Math.round(sum.experience / c), Certification: Math.round(sum.certification / c), Skills: Math.round(sum.skills / c), Education: Math.round(sum.education / c) } : { Experience: 0, Certification: 0, Skills: 0, Education: 0 };
          drawBar(avgs);
          drawLine(times, totals);
        } catch (e) {
          console.warn("refresh failed", e);
        }
      }
      document.getElementById("refreshBtn").addEventListener("click", () => refreshAll());
      document.getElementById("scoreBtn").addEventListener("click", async () => {
        const v = validate();
        if (!v.ok) {
          alert(v.msg);
          return;
        }
        const name = document.getElementById("name").value.trim();
        const years = Number(document.getElementById("years").value);
        const education = document.getElementById("education").value;
        const cert = document.getElementById("cert").value;
        const skillsNodes = Array.from(document.querySelectorAll(".skill"));
        const skills = {};
        skillsNodes.forEach((n) => skills[n.dataset.skill] = Number(n.value || 0));
        const weights = { exp: Number(document.getElementById("w_exp").value), cert: Number(document.getElementById("w_cert").value), skills: Number(document.getElementById("w_skills").value), edu: Number(document.getElementById("w_edu").value) };
        const calc = calculateTotal();
        const position = decide(calc.total);
        const certSuggest = cert === "None" || calc.scores.certification < 60 ? ["PMP", "CAPM"] : [];
        const payload = { name, years, education, cert, skills, weights, scores: calc.scores, total: calc.total, position, certSuggest };
        const saved = await saveEvaluation(payload);
        alert("Saved: " + saved.name + " \u2022 Score: " + saved.total);
        await refreshAll();
      });
      document.getElementById("exportBtn").addEventListener("click", () => {
        const latest = localStorage.getItem("pm_latest");
        if (!latest) {
          alert("No latest result to export");
          return;
        }
        const blob = new Blob([latest], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "evaluation.json";
        document.body.appendChild(a);
        a.click();
        a.remove();
      });
      document.getElementById("validateBtn").addEventListener("click", () => {
        const v = validate();
        if (!v.ok) alert(v.msg);
        else alert("Validation passed");
      });
      document.getElementById("resetBtn").addEventListener("click", () => {
        if (!confirm("Reset?")) return;
        document.getElementById("name").value = "";
        document.getElementById("years").value = "3";
        document.getElementById("education").value = "Master";
        document.getElementById("cert").value = "None";
        document.querySelectorAll(".skill").forEach((n) => n.value = "0");
        ["w_exp", "w_cert", "w_skills", "w_edu"].forEach((k) => {
          document.getElementById(k).value = k === "w_exp" ? 40 : k === "w_cert" ? 30 : k === "w_skills" ? 20 : 10;
          syncWeight(k, k + "_val");
        });
      });
      refreshAll();
    }
  });
  require_app();
})();
//# sourceMappingURL=app.js.map
