/* Nexa Manga - library store. The BACKEND is the source of truth (favorites, reading progress, preferences);
 * a per-user local cache only makes the first paint instant and covers short network failures. */
(function () {
  "use strict";
  const S = { uid: 0, favs: new Map(), hist: [], prefs: {}, summary: null, loaded: false };
  const ckey = () => `nexa:cache:u${S.uid}`;
  const sleepless = (fn) => { try { fn(); } catch (_) {} };

  function cacheSave() {
    sleepless(() => localStorage.setItem(ckey(), JSON.stringify({ favs: [...S.favs.values()], hist: S.hist, prefs: S.prefs, summary: S.summary })));
  }
  function cacheLoad() {
    sleepless(() => {
      const c = JSON.parse(localStorage.getItem(ckey()) || "null");
      if (!c) return;
      S.favs = new Map((c.favs || []).map((m) => [m.id, m]));
      S.hist = c.hist || []; S.prefs = c.prefs || {}; S.summary = c.summary || null;
    });
  }

  function applyPrefs(prefs) {
    S.prefs = prefs || {};
    if (S.prefs.language && S.prefs.language !== I18n.pref()) I18n.setQuiet(S.prefs.language);
    if (S.prefs.theme && S.prefs.theme !== Theme.pref()) Theme.setQuiet(S.prefs.theme);
  }

  async function load(user) {
    S.uid = user.id;
    cacheLoad();
    applyPrefs(S.prefs);
    const [f, h, p, s] = await Promise.allSettled([Api.get("/library/favorites"), Api.get("/library/history"), Api.get("/library/prefs"), Api.get("/library/summary")]);
    if (f.status === "fulfilled") S.favs = new Map((f.value.items || []).map((m) => [m.id, m]));
    if (h.status === "fulfilled") S.hist = h.value.items || [];
    if (s.status === "fulfilled") S.summary = s.value;
    if (p.status === "fulfilled") {
      const server = p.value.prefs || {};
      if (!Object.keys(server).length) { // first sign-in with the new backend: push what this device had
        const local = { language: I18n.pref(), theme: Theme.pref() };
        savePrefs(local);
      } else applyPrefs(server);
    }
    S.loaded = true;
    cacheSave();
    return S;
  }

  // ---- favorites
  const isFav = (id) => S.favs.has(Number(id));
  const favList = () => [...S.favs.values()];
  async function toggleFav(manga) {
    const id = Number(manga.id), had = S.favs.has(id);
    if (had) S.favs.delete(id); else S.favs.set(id, { id, title: manga.title, cover_url: manga.cover_url, chapters_count: manga.chapters_count });
    try {
      if (had) await Api.del(`/library/favorites/${id}`); else await Api.put(`/library/favorites/${id}`);
      if (S.summary) S.summary.favorites = S.favs.size;
      cacheSave();
      return !had;
    } catch (e) {
      if (had) S.favs.set(id, manga); else S.favs.delete(id);   // revert the optimistic change
      throw e;
    }
  }
  async function clearFavorites() { await Api.del("/library/favorites"); S.favs.clear(); if (S.summary) S.summary.favorites = 0; cacheSave(); }

  // ---- history / progress
  const histList = () => [...S.hist].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
  const entry = (mangaId) => S.hist.find((e) => e.manga.id === Number(mangaId)) || null;
  let pending = null, timer = null;
  function queueProgress(manga, chapter, page, total) {
    let e = entry(manga.id);
    if (!e) { e = { manga: { id: manga.id, title: manga.title, cover_url: manga.cover_url || null }, read: [] }; S.hist.unshift(e); }
    if (total && page >= total && !e.read.includes(chapter.id)) e.read.push(chapter.id);
    Object.assign(e, { chapter_id: chapter.id, number: chapter.number, page, total, updated_at: new Date().toISOString().replace("Z", "") });
    pending = { manga_id: manga.id, chapter_id: chapter.id, page, total };
    clearTimeout(timer);
    timer = setTimeout(flush, 1800);
  }
  async function flush(keepalive) {
    clearTimeout(timer);
    if (!pending) return;
    const body = pending; pending = null;
    try { await Api.put("/library/progress", body, { keepalive: !!keepalive }); cacheSave(); }
    catch (_) { pending = pending || body; }   // retried by the next save
  }
  async function removeHistory(mangaId) { S.hist = S.hist.filter((e) => e.manga.id !== Number(mangaId)); cacheSave(); await Api.del(`/library/history/${mangaId}`); }
  async function clearHistory() { await Api.del("/library/history"); S.hist = []; cacheSave(); }
  async function refreshSummary() {
    try { S.summary = await Api.get("/library/summary"); cacheSave(); } catch (_) { /* keep cache */ }
    return S.summary || { favorites: S.favs.size, mangas_started: S.hist.length, chapters_read: S.hist.reduce((n, e) => n + (e.read || []).length, 0) };
  }

  // ---- preferences (language / theme / reader mode), synced
  let prefTimer;
  function savePrefs(partial) {
    S.prefs = { ...S.prefs, ...partial };
    cacheSave();
    clearTimeout(prefTimer);
    prefTimer = setTimeout(() => Api.put("/library/prefs", S.prefs).catch(() => {}), 500);
  }

  document.addEventListener("visibilitychange", () => { if (document.hidden) flush(true); });
  addEventListener("pagehide", () => flush(true));

  window.Store = { S, load, isFav, favList, toggleFav, clearFavorites, histList, entry, queueProgress, flush, removeHistory, clearHistory,
    refreshSummary, savePrefs, prefs: () => S.prefs };
})();
