/* Nexa Manga - themes. "auto" follows the Telegram light/dark scheme. Switching animates as a circular reveal. */
(function () {
  "use strict";
  const KEY = "nexa:theme";
  const THEMES = [
    { id: "nexa",   colors: ["#0b0b14", "#7c5cff", "#22d3ee"] },
    { id: "light",  colors: ["#f4f5fb", "#6246ea", "#0ea5c6"] },
    { id: "amoled", colors: ["#000000", "#a78bfa", "#38bdf8"] },
    { id: "sakura", colors: ["#fff3f7", "#ec4899", "#fb7185"] },
    { id: "ocean",  colors: ["#06121f", "#38bdf8", "#34d399"] },
    { id: "sunset", colors: ["#140a0a", "#ff7a45", "#ffc857"] },
  ];
  const ids = THEMES.map((t) => t.id);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function pref() { try { return localStorage.getItem(KEY) || "auto"; } catch (_) { return "auto"; } }
  function resolve(p) {
    if (ids.includes(p)) return p;
    const scheme = (window.Telegram && Telegram.WebApp && Telegram.WebApp.colorScheme)
      || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    return scheme === "light" ? "light" : "nexa";
  }
  function apply() {
    const id = resolve(pref());
    document.documentElement.setAttribute("data-theme", id);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim() || "#0b0b14";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bg);
    const tg = window.Telegram && Telegram.WebApp;
    if (tg) { try { tg.setHeaderColor(bg); tg.setBackgroundColor(bg); tg.setBottomBarColor && tg.setBottomBarColor(bg); } catch (_) {} }
  }
  function store(p) { try { localStorage.setItem(KEY, p); } catch (_) {} }
  /** Set from the server (no echo back, no animation). */
  function setQuiet(p) { store(p); apply(); }
  /** User action: animated circular reveal from the tap point when the browser supports it. */
  function set(p, ev, after) {
    store(p);
    const run = () => { apply(); if (after) after(); };
    if (document.startViewTransition && !reduce) {
      const x = ev && ev.clientX != null ? ev.clientX : innerWidth / 2, y = ev && ev.clientY != null ? ev.clientY : innerHeight / 2;
      document.documentElement.style.setProperty("--tx", x + "px");
      document.documentElement.style.setProperty("--ty", y + "px");
      try { document.startViewTransition(run); } catch (_) { run(); }
    } else run();
    if (typeof window.Theme.onChange === "function") window.Theme.onChange(p);
  }

  apply();
  window.Theme = { THEMES, pref, set, setQuiet, apply, onChange: null };
})();
