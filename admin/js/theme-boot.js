/* Admin look = the mini app's look. ../js/theme.js (shared) applies the saved theme before first paint;
 * this adds the aurora background and exposes the theme picker used by the sidebar. */
"use strict";
(function () {
  function aurora() {
    if (document.querySelector(".aurora")) return;
    const a = document.createElement("div");
    a.className = "aurora"; a.setAttribute("aria-hidden", "true");
    ["a", "b", "c"].forEach((c) => { const o = document.createElement("i"); o.className = "orb " + c; a.append(o); });
    document.body.prepend(a);
  }
  const NAMES = { nexa: "Nexa", light: "Clair", amoled: "Amoled", sakura: "Sakura", ocean: "Océan", sunset: "Coucher de soleil" };

  window.buildThemePicker = function () {
    const T = window.Theme;
    const box = document.createElement("div");
    box.className = "theme-picker";
    if (!T) return box;
    const label = document.createElement("small"); label.textContent = "Thème"; box.append(label);
    const paint = () => box.querySelectorAll("button").forEach((b) => b.classList.toggle("on", b.dataset.id === T.pref()));
    [{ id: "auto" }, ...T.THEMES].forEach((t) => {
      const b = document.createElement("button");
      b.type = "button"; b.dataset.id = t.id; b.title = t.id === "auto" ? "Automatique" : NAMES[t.id] || t.id;
      if (t.id === "auto") b.className = "auto"; else { b.style.setProperty("--c1", t.colors[0]); b.style.setProperty("--c2", t.colors[1]); }
      b.addEventListener("click", (e) => { T.set(t.id, e, paint); });
      box.append(b);
    });
    paint();
    return box;
  };

  /* Tables become stacked cards on phones: every cell needs its column title (CSS shows it with attr(data-label)). */
  function labelTables() {
    document.querySelectorAll("table.admin-table").forEach((t) => {
      const heads = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      t.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => {
        if (!td.dataset.label && heads[i] && td.colSpan <= 1) td.dataset.label = heads[i];
      }));
    });
  }
  function watchTables() {
    let queued = false;
    const run = () => { queued = false; labelTables(); };
    const obs = new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } });
    document.querySelectorAll("table.admin-table tbody").forEach((tb) => obs.observe(tb, { childList: true }));
    labelTables();
  }

  function ready() { aurora(); watchTables(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready); else ready();
})();
