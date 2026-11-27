/* Nexa Admin - dashboard (the original file was a stub: nothing but the four counters worked). */
"use strict";
(function () {
  const $ = (id) => document.getElementById(id);
  const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const when = (iso) => (typeof formatDate === "function" ? formatDate(iso) : iso || "");

  function row(title, sub, extra) {
    const r = el("div", "list-row");
    r.style.cssText = "display:flex;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.07)";
    const left = el("div"); left.style.minWidth = "0";
    const t = el("strong", "", title); t.style.cssText = "display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap";
    const s = el("small", "", sub); s.style.opacity = ".7";
    left.append(t, s); r.append(left);
    if (extra) { const x = el("small", "", extra); x.style.cssText = "opacity:.7;white-space:nowrap"; r.append(x); }
    return r;
  }
  function fill(id, rows, emptyText) {
    const box = $(id); if (!box) return;
    box.replaceChildren(...(rows.length ? rows : [el("p", "", emptyText)]));
  }

  let chart;
  function drawChart(s) {
    const canvas = $("statisticsChart");
    if (!canvas || !window.Chart) return;
    if (chart) chart.destroy();
    chart = new window.Chart(canvas, {
      type: "bar",
      data: { labels: ["Utilisateurs", "Mangas", "Chapitres", "Catégories", "Commentaires"],
        datasets: [{ data: [s.users, s.mangas, s.chapters, s.categories, s.comments].map((n) => n || 0),
          backgroundColor: ["#7C5CFF", "#22D3EE", "#34D399", "#F59E0B", "#FB7185"], borderRadius: 8 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0, color: "#A1A1AA" }, grid: { color: "rgba(255,255,255,.06)" } }, x: { ticks: { color: "#A1A1AA" }, grid: { display: false } } } },
    });
  }

  async function initializeDashboardPage() {
    const safe = (p, params) => window.API.get(p, params).catch(() => ({ items: [] }));
    const [stats, mangas, users, comments, reports] = await Promise.all([
      safe("/statistics"), safe("/mangas", { per_page: 5, sort: "latest" }), safe("/users", { per_page: 5 }),
      safe("/comments", { per_page: 5 }), safe("/reports", { per_page: 5, status: "pending" }),
    ]);
    const s = stats.statistics || stats;
    set("users-count", s.users ?? 0); set("mangas-count", s.mangas ?? 0); set("chapters-count", s.chapters ?? 0);
    set("comments-count", s.comments ?? 0); set("reports-count", s.reports_pending ?? 0); set("new-users-count", s.new_users_7d ?? 0);
    set("users-growth", `+${s.new_users_7d ?? 0} / 7 j`); set("reports-growth", "en attente");
    ["mangas-growth", "chapters-growth", "comments-growth", "new-users-growth"].forEach((id) => set(id, ""));

    fill("latest-mangas", (mangas.items || []).map((m) => row(m.title, `${m.chapters_count ?? 0} chapitre(s) · ${m.status || ""}`, when(m.created_at))), "Aucun manga.");
    fill("latest-users", (users.items || []).map((u) => row(u.name || u.username, u.role + " · " + u.status, when(u.created_at))), "Aucun utilisateur.");
    const activity = [
      ...(comments.items || []).map((c) => ({ at: c.created_at, node: row("Commentaire de " + ((c.author && c.author.name) || "—"), (c.content || "").slice(0, 80), when(c.created_at)) })),
      ...(reports.items || []).map((r) => ({ at: r.created_at, node: row("Signalement #" + r.id, (r.reason || "").slice(0, 80), when(r.created_at)) })),
    ].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 8);
    fill("recent-activity", activity.map((a) => a.node), "Aucune activité récente.");
    drawChart(s);
  }
  window.initializeDashboardPage = initializeDashboardPage;
  document.addEventListener("DOMContentLoaded", () => { const b = $("refreshActivity"); if (b) b.addEventListener("click", initializeDashboardPage); });
})();
