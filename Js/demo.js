/* Nexa Manga - demo preview. Active only OUTSIDE Telegram, when the file is opened locally (file://), with ?demo=1,
 * or after pressing "Preview the design". It replaces the API by in-memory sample data: no network, no account,
 * nothing is sent anywhere. Inside Telegram this file does nothing. */
(function () {
  "use strict";
  const inTelegram = !!(window.Telegram && Telegram.WebApp && Telegram.WebApp.initData);
  const flag = (() => { try { return sessionStorage.getItem("nexa_demo") === "1"; } catch (_) { return false; } })();
  const wanted = !inTelegram && (flag || location.protocol === "file:" || /[?&]demo(=1|&|$)/.test(location.search));
  Nexa.demo = wanted;
  Nexa.demoAvailable = !inTelegram;
  Nexa.startDemo = () => { try { sessionStorage.setItem("nexa_demo", "1"); } catch (_) {} location.href = location.pathname + "?demo=1"; };
  Nexa.exitDemo = () => { try { sessionStorage.removeItem("nexa_demo"); } catch (_) {} location.href = location.pathname; };
  if (!wanted) return;

  const fr = () => (I18n.lang() === "fr");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
  const svg = (body, w, h) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>${body}</svg>`);
  const PAL = [["#7c5cff", "#22d3ee"], ["#ff5d8f", "#ff9d5c"], ["#34d399", "#0ea5e9"], ["#f59e0b", "#ef4444"], ["#6366f1", "#ec4899"], ["#0ea5e9", "#22c55e"], ["#a855f7", "#f43f5e"], ["#14b8a6", "#6366f1"]];
  const grad = (i) => `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${PAL[i % 8][0]}'/><stop offset='1' stop-color='${PAL[i % 8][1]}'/></linearGradient></defs>`;
  function cover(i, title) {
    const words = title.split(" "), l1 = words.slice(0, Math.ceil(words.length / 2)).join(" "), l2 = words.slice(Math.ceil(words.length / 2)).join(" ");
    return svg(`${grad(i)}<rect width='400' height='600' fill='url(#g)'/><circle cx='${300 - i * 9}' cy='${130 + (i % 3) * 20}' r='${80 + i * 4}' fill='rgba(255,255,255,.2)'/><circle cx='90' cy='300' r='46' fill='rgba(255,255,255,.1)'/><path d='M0 430 Q120 350 240 420 T400 380 V600 H0Z' fill='rgba(0,0,0,.28)'/><text x='28' y='500' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='46' fill='white'>${esc(l1)}</text><text x='28' y='552' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='46' fill='white'>${esc(l2)}</text>`, 400, 600);
  }
  const banner = (i) => svg(`${grad(i)}<rect width='800' height='420' fill='url(#g)'/><circle cx='620' cy='120' r='170' fill='rgba(255,255,255,.18)'/><circle cx='160' cy='330' r='110' fill='rgba(0,0,0,.18)'/>`, 800, 420);
  function page(i, ch, n) {
    const r = (a) => ((i * 7 + ch * 13 + n * 17 + a) % 40);
    const p = (x, y, w, h, k) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='10' fill='${PAL[(i + k) % 8][k % 2]}' stroke='white' stroke-width='6'/><circle cx='${x + w * .65}' cy='${y + h * .4}' r='${28 + r(k)}' fill='rgba(255,255,255,.22)'/>`;
    return svg(`<rect width='800' height='1200' fill='#111'/>${p(30, 30, 740, 360 + r(1), 0)}${p(30, 430 + r(1), 360, 340, 1)}${p(410, 430 + r(1), 360, 340, 2)}${p(30, 810 + r(1), 740, 330 - r(1), 3)}<ellipse cx='200' cy='${180}' rx='120' ry='52' fill='white'/><text x='200' y='188' text-anchor='middle' font-family='Arial' font-weight='700' font-size='30' fill='#111'>Nexa ${n}</text>`, 800, 1200);
  }

  const TITLES = ["Solo Nexa", "Blade of Dawn", "Cyber Sakura", "Moon Walker", "One Last Page", "Tower of Gods", "Ocean Heart", "Neon Ronin"];
  const CATS = [{ id: 1, name: "Action", color: "#7c5cff" }, { id: 2, name: "Romance", color: "#ff5d8f" }, { id: 3, name: "Fantasy", color: "#22d3ee" }, { id: 4, name: "Sci-Fi", color: "#34d399" }];
  const DESC_FR = "Un héros inattendu, un monde au bord du gouffre et des secrets qui changent tout. Une aventure rythmée, pleine de mystères, d'amitiés fortes et de combats spectaculaires.";
  const DESC_EN = "An unlikely hero, a world on the edge and secrets that change everything. A fast-paced adventure full of mysteries, strong friendships and spectacular fights.";
  const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString().replace("Z", "");
  const MANGAS = TITLES.map((t, i) => ({ id: i + 1, title: t, cover_url: cover(i, t), banner_url: banner(i), status: i % 4 === 3 ? "completed" : "ongoing",
    category: CATS[i % 4], category_id: CATS[i % 4].id, chapters_count: 3 + (i % 3), created_at: hoursAgo(300 - i * 20), updated_at: hoursAgo(5 + i * 9) }));
  const desc = (m) => (fr() ? DESC_FR : DESC_EN);
  const chaptersOf = (m) => Array.from({ length: m.chapters_count }, (_, k) => ({ id: m.id * 100 + k + 1, manga_id: m.id, number: k + 1, title: k === 0 ? (fr() ? "Le commencement" : "The beginning") : null,
    published_at: hoursAgo((m.chapters_count - k) * 30 + m.id * 3), pages_count: 6 }));
  const allChapters = MANGAS.flatMap(chaptersOf);

  const S = { favs: [1, 3], hist: [{ manga_id: 2, chapter_id: 201, page: 3, total: 6, read: [] }], prefs: {}, comments: [], notifs: true };
  const user = () => ({ id: 0, name: I18n.t("demo_login"), username: "demo", role: "user", is_admin: false, photo_url: null });
  const full = (m) => ({ ...m, description: desc(m) });
  const histItems = () => S.hist.map((e) => { const m = MANGAS[e.manga_id - 1]; return { manga: { id: m.id, title: m.title, cover_url: m.cover_url }, chapter_id: e.chapter_id, number: e.chapter_id % 100, page: e.page, total: e.total, read: e.read, updated_at: hoursAgo(2) }; });
  const pageOf = (items, params, key = "items") => { const per = Number(params.per_page) || 18, p = Number(params.page) || 1; return { success: true, [key]: items.slice((p - 1) * per, p * per), total: items.length, page: p, total_pages: Math.max(1, Math.ceil(items.length / per)) }; };

  function route(method, path, params, body) {
    const u = path.replace(/^\/+/, ""), id = (re) => { const m = u.match(re); return m ? Number(m[1]) : null; };
    if (u === "auth/me") return { success: true, user: user() };
    if (u === "config") return { success: true, bot_username: null };
    if (u === "categories") return CATS;
    if (u === "mangas") {
      let items = MANGAS.filter((m) => (!params.q || m.title.toLowerCase().includes(String(params.q).toLowerCase())) && (!params.category_id || String(m.category_id) === String(params.category_id)));
      if (params.sort === "title") items = [...items].sort((a, b) => a.title.localeCompare(b.title));
      else if (params.sort === "updated") items = [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
      else items = [...items].reverse();
      return pageOf(items.map(full), params);
    }
    if (id(/^mangas\/(\d+)$/)) { const m = MANGAS[id(/^mangas\/(\d+)$/) - 1]; return m ? { success: true, manga: { ...full(m), chapters: chaptersOf(m) } } : Promise.reject(Object.assign(new Error("nf"), { status: 404 })); }
    if (u === "chapters/latest") return pageOf([...allChapters].sort((a, b) => b.published_at.localeCompare(a.published_at)).map((c) => ({ ...c, manga: { id: c.manga_id, title: MANGAS[c.manga_id - 1].title, cover_url: MANGAS[c.manga_id - 1].cover_url } })), { per_page: params.per_page || 10 });
    if (id(/^chapters\/(\d+)\/read$/)) {
      const cid = id(/^chapters\/(\d+)\/read$/), c = allChapters.find((x) => x.id === cid), m = c && MANGAS[c.manga_id - 1];
      if (!c) return Promise.reject(Object.assign(new Error("nf"), { status: 404 }));
      const sib = allChapters.filter((x) => x.manga_id === c.manga_id);
      return { success: true, chapter: { ...c, pages: Array.from({ length: 6 }, (_, n) => page(m.id, c.number, n + 1)) }, manga: { id: m.id, title: m.title }, prev_id: (sib.find((x) => x.number === c.number - 1) || {}).id || null, next_id: (sib.find((x) => x.number === c.number + 1) || {}).id || null };
    }
    if (u === "comments" && method === "GET") return { success: true, items: [{ id: 1, content: fr() ? "Ce chapitre est incroyable, vivement la suite !" : "This chapter is amazing, can't wait for the next one!", created_at: hoursAgo(3), author: { id: 9, name: "Awa" } }, { id: 2, content: fr() ? "Le dessin est magnifique 😍" : "The artwork is gorgeous 😍", created_at: hoursAgo(20), author: { id: 11, name: "Kevin" } }, ...S.comments] };
    if (u === "comments" && method === "POST") { const c = { id: Date.now(), content: String(body.content || "").slice(0, 1000), created_at: hoursAgo(0), author: { id: 0, name: user().name } }; S.comments.unshift(c); return { success: true, comment: c }; }
    if (/^comments\/\d+/.test(u)) return { success: true };
    if (u === "notifications/me/unread-count") return { success: true, unread: S.notifs ? 2 : 0 };
    if (u === "notifications/me/read-all") { S.notifs = false; return { success: true }; }
    if (u === "notifications/me") return pageOf([{ id: 1, title: fr() ? "Nouveau chapitre" : "New chapter", message: fr() ? "Solo Nexa — chapitre 3 est disponible." : "Solo Nexa — chapter 3 is out.", is_read: !S.notifs, created_at: hoursAgo(2) }, { id: 2, title: fr() ? "Bienvenue sur Nexa Manga" : "Welcome to Nexa Manga", message: fr() ? "Ceci est un aperçu avec des données fictives." : "This is a preview with sample data.", is_read: !S.notifs, created_at: hoursAgo(30) }], params, "items");
    // library
    if (u === "library/favorites" && method === "GET") return { success: true, items: S.favs.map((i) => full(MANGAS[i - 1])) };
    if (id(/^library\/favorites\/(\d+)$/) && method === "PUT") { const i = id(/^library\/favorites\/(\d+)$/); if (!S.favs.includes(i)) S.favs.push(i); return { success: true }; }
    if (id(/^library\/favorites\/(\d+)$/) && method === "DELETE") { const i = id(/^library\/favorites\/(\d+)$/); S.favs = S.favs.filter((x) => x !== i); return { success: true }; }
    if (u === "library/favorites" && method === "DELETE") { S.favs = []; return { success: true }; }
    if (u === "library/history" && method === "GET") return { success: true, items: histItems() };
    if (u === "library/history" && method === "DELETE") { S.hist = []; return { success: true }; }
    if (id(/^library\/history\/(\d+)$/)) { const i = id(/^library\/history\/(\d+)$/); S.hist = S.hist.filter((e) => e.manga_id !== i); return { success: true }; }
    if (u === "library/progress" && method === "PUT") {
      const prev = S.hist.find((e) => e.manga_id === body.manga_id), read = new Set((prev && prev.read) || []);
      if (body.total && body.page >= body.total) read.add(body.chapter_id);
      S.hist = [{ manga_id: body.manga_id, chapter_id: body.chapter_id, page: body.page, total: body.total, read: [...read] }, ...S.hist.filter((e) => e.manga_id !== body.manga_id)];
      return { success: true };
    }
    if (u === "library/prefs" && method === "GET") return { success: true, prefs: S.prefs };
    if (u === "library/prefs" && method === "PUT") { S.prefs = { ...S.prefs, ...body }; return { success: true, prefs: S.prefs }; }
    if (u === "library/summary") return { success: true, favorites: S.favs.length, mangas_started: S.hist.length, chapters_read: 7 + S.hist.reduce((n, e) => n + e.read.length, 0) };
    return { success: true };
  }
  const call = (method) => (p, a, b) => new Promise((res, rej) => setTimeout(() => { try { Promise.resolve(route(method, p, method === "GET" ? (a || {}) : {}, method === "GET" ? {} : (a || {}))).then(res, rej); } catch (e) { rej(e); } }, 120));

  window.Api = {
    ApiError: Error, initData: () => "demo", clear() {},
    login: () => Promise.resolve({ success: true, user: user() }), me: () => call("GET")("auth/me"), config: () => call("GET")("config"),
    get: call("GET"), post: call("POST"), put: call("PUT"), patch: call("PATCH"), del: call("DELETE"),
  };
})();
