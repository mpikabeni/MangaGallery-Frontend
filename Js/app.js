/* Nexa Manga - mini app (hash router + views). No innerHTML with data: everything uses textContent. */
(function () {
  "use strict";

  const cfg = window.NEXA_CONFIG;
  const tg = window.Telegram && Telegram.WebApp;
  const T = (k, v) => I18n.t(k, v);
  const $root = document.getElementById("app");
  const API_ORIGIN = new URL(cfg.apiUrl).origin;
  const state = { user: null, unread: 0 };

  /* ------------------------------------------------------------------ helpers */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat()) {
      if (kid === null || kid === undefined || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const icon = (n, c) => Icons.icon(n, c);

  function safeImg(u) {
    if (typeof u !== "string" || !u) return null;
    if (u.startsWith("/") && !u.startsWith("//")) return API_ORIGIN + u;
    return /^https?:\/\/[^\s"'<>]+$/i.test(u) ? u : null;
  }
  function haptic(kind) {
    const hf = tg && tg.HapticFeedback;
    if (!hf) return;
    try {
      if (["success", "error", "warning"].includes(kind)) hf.notificationOccurred(kind);
      else hf.impactOccurred(kind || "light");
    } catch (_) {}
  }
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector(".toast");
    if (!el) { el = h("div", { class: "toast", role: "status" }); document.body.append(el); }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function askConfirm(msg) {
    return new Promise((res) => (tg && tg.showConfirm ? tg.showConfirm(msg, res) : res(window.confirm(msg))));
  }
  function openLink(url) {
    if (tg && /^https:\/\/t\.me\//i.test(url) && tg.openTelegramLink) tg.openTelegramLink(url);
    else if (tg && tg.openLink) tg.openLink(url);
    else window.open(url, "_blank", "noopener");
  }
  function timeAgo(iso) {
    if (!iso) return "";
    const s = Math.round((new Date(iso + (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? "" : "Z")) - Date.now()) / 1000);
    const rtf = new Intl.RelativeTimeFormat(I18n.lang(), { numeric: "auto" });
    const abs = Math.abs(s);
    if (abs < 45) return T("just_now");
    if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
    if (abs < 2592000) return rtf.format(Math.round(s / 86400), "day");
    return rtf.format(Math.round(s / 2592000), "month");
  }
  const num = (n) => (Number.isInteger(+n) ? String(+n) : String(+n));
  const initials = (s) => (String(s || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase();
  function gradient(seed) {
    const a = (Number(seed) * 47) % 360, b = (a + 55) % 360;
    return `linear-gradient(135deg, hsl(${a} 70% 45%), hsl(${b} 75% 38%))`;
  }

  /* ------------------------------------------------------------------ local library (per Telegram user) */
  const Lib = {
    _k: (n) => `nexa:u${state.user ? state.user.id : 0}:${n}`,
    _r(n, def) { try { const v = JSON.parse(localStorage.getItem(this._k(n))); return v == null ? def : v; } catch (_) { return def; } },
    _w(n, v) { try { localStorage.setItem(this._k(n), JSON.stringify(v)); } catch (_) {} },
    favs() { return this._r("fav", []); },
    isFav(id) { return this.favs().some((m) => m.id === id); },
    toggleFav(m) {
      let f = this.favs();
      const has = f.some((x) => x.id === m.id);
      f = has ? f.filter((x) => x.id !== m.id) : [{ id: m.id, title: m.title, cover_url: m.cover_url }, ...f];
      this._w("fav", f);
      return !has;
    },
    hist() { return this._r("hist", {}); },
    histList() { return Object.values(this.hist()).sort((a, b) => b.at - a.at); },
    entry(mangaId) { return this.hist()[mangaId] || null; },
    touch(manga, chapter, page, total) {
      const all = this.hist();
      const prev = all[manga.id] || { read: [] };
      const read = new Set(prev.read || []);
      if (total && page >= total) read.add(chapter.id);
      all[manga.id] = { m: { id: manga.id, title: manga.title, cover_url: manga.cover_url || null }, chapterId: chapter.id,
        number: chapter.number, page, total, at: Date.now(), read: [...read].slice(-400) };
      const keep = Object.values(all).sort((a, b) => b.at - a.at).slice(0, 60);
      this._w("hist", Object.fromEntries(keep.map((e) => [e.m.id, e])));
    },
    clear(name) { this._w(name, name === "fav" ? [] : {}); },
  };

  /* ------------------------------------------------------------------ UI building blocks */
  function cover(m, badge) {
    const url = safeImg(m && m.cover_url);
    const box = h("div", { class: "cover" });
    if (url) {
      const img = h("img", { src: url, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer" });
      img.addEventListener("error", () => { img.remove(); box.prepend(placeholder()); });
      box.append(img);
    } else box.append(placeholder());
    function placeholder() {
      const ph = h("div", { class: "ph", text: initials(m && m.title) });
      ph.style.background = gradient((m && m.id) || 1);
      return ph;
    }
    if (badge) box.append(h("span", { class: "badge", text: badge }));
    return box;
  }
  function mangaCard(m, opts = {}) {
    const sub = opts.sub !== undefined ? opts.sub : (m.chapters_count ? `${m.chapters_count} ${T("chapters").toLowerCase()}` : "");
    return h("a", { class: "mcard", href: `#/manga/${m.id}` },
      cover(m, opts.badge),
      h("div", { class: "t", text: m.title }),
      sub ? h("div", { class: "s", text: sub }) : null,
      opts.progress != null ? h("div", { class: "progress" }, h("i", { style: `width:${Math.max(3, Math.min(100, opts.progress))}%` })) : null);
  }
  function avatar(user) {
    const url = safeImg(user && user.photo_url);
    const a = h("span", { class: "avatar" });
    if (url) {
      const img = h("img", { src: url, alt: "", referrerpolicy: "no-referrer" });
      img.addEventListener("error", () => { img.remove(); a.textContent = initials(user.name); });
      a.append(img);
    } else a.textContent = initials(user && user.name);
    return a;
  }
  function empty(ic, title, body, action) {
    return h("div", { class: "empty" }, icon(ic), h("b", { text: title }), body ? h("p", { text: body }) : null, action || null);
  }
  const skel = (n, hgt) => Array.from({ length: n }, () => { const s = h("div", { class: "skel" }); s.style.height = hgt + "px"; return s; });

  function statusTag(s) {
    const map = { ongoing: "status_ongoing", completed: "status_completed", paused: "status_paused", hiatus: "status_hiatus", cancelled: "status_cancelled" };
    return map[s] ? T(map[s]) : "";
  }

  /* ------------------------------------------------------------------ screens (gate, errors) */
  function screen(opts) {
    $root.replaceChildren(h("div", { class: "screen" },
      h("img", { class: "logo", src: "assets/logo.svg", alt: "Nexa" }),
      opts.spinner ? h("div", { class: "spinner" }) : null,
      opts.title ? h("h1", { text: opts.title }) : null,
      opts.body ? h("p", { text: opts.body }) : null,
      opts.buttons ? h("div", { class: "btns" }, opts.buttons.map((b) =>
        h("button", { class: "btn " + (b.cls || ""), type: "button", onclick: b.onClick }, b.icon ? icon(b.icon) : null, b.label))) : null));
  }

  function showGate(info) {
    const channel = (info && info.channel) || cfg.channel;
    const url = (info && info.channel_url) || cfg.channelUrl;
    screen({
      title: T("gate_title"), body: T("gate_body", { channel }),
      buttons: [
        { label: T("join_channel", { channel }), cls: "btn-primary", icon: "send", onClick: () => { haptic("light"); openLink(url); } },
        { label: T("i_joined"), icon: "check", onClick: async (ev) => {
            const btn = ev.currentTarget; btn.setAttribute("disabled", "");
            try { await authenticate(); haptic("success"); start(); }
            catch (e) {
              btn.removeAttribute("disabled");
              if (e.code === "NOT_MEMBER") { haptic("error"); toast(T("not_joined_yet")); } else authError(e);
            }
          } },
      ],
    });
  }
  function authError(e) {
    const retry = { label: T("retry"), cls: "btn-primary", onClick: boot };
    switch (e && e.code) {
      case "NOT_MEMBER": return showGate(e.data);
      case "MAINTENANCE": return screen({ title: T("maint_title"), body: T("maint_body"), buttons: [retry] });
      case "REGISTRATION_CLOSED": return screen({ title: T("closed_title"), body: T("closed_body") });
      case "ACCOUNT_DISABLED": return screen({ title: T("disabled_title"), body: T("disabled_body") });
      case "INVALID_INIT_DATA": return screen({ title: T("tg_only_title"), body: T("tg_only_body") });
      default: return screen({ title: T("error_title"), body: T("error_body"), buttons: [retry] });
    }
  }
  async function authenticate() {
    const d = await Api.login();
    state.user = d.user;
    return d;
  }

  /* ------------------------------------------------------------------ router */
  let navToken = 0;
  const current = () => parseHash();
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    return { path, q: new URLSearchParams(qs || "") };
  }
  const ROOTS = { "/": "home", "/browse": "browse", "/library": "library", "/library/favorites": "library", "/library/history": "library", "/settings": "settings" };

  const routes = [
    [/^\/?$/, home], [/^\/browse$/, browse], [/^\/manga\/(\d+)$/, mangaPage], [/^\/read\/(\d+)$/, reader],
    [/^\/library(?:\/(favorites|history))?$/, library], [/^\/notifications$/, notifications], [/^\/settings$/, settings],
  ];

  async function navigate() {
    const my = ++navToken;
    document.body.style.overflow = "";
    const { path, q } = parseHash();
    syncBackButton(path);
    window.scrollTo(0, 0);
    for (const [rx, view] of routes) {
      const m = path.match(rx);
      if (!m) continue;
      const ctx = { params: m.slice(1), q, ok: () => my === navToken, path };
      try { await view(ctx); }
      catch (e) {
        if (!ctx.ok()) return;
        if (["NOT_MEMBER", "MAINTENANCE", "ACCOUNT_DISABLED", "INVALID_INIT_DATA"].includes(e.code)) return authError(e);
        render(page({ title: T("error_title"), back: path !== "/", body: empty("info", T("error_title"), T("error_body"),
          h("button", { class: "btn btn-primary", onclick: navigate }, T("retry"))) }), ROOTS[path]);
      }
      return;
    }
    location.replace("#/");
  }

  function go(hash) { location.hash = hash; }
  function goBack() { if (history.length > 1) history.back(); else go("#/"); }
  function syncBackButton(path) {
    if (!tg || !tg.BackButton) return;
    if (ROOTS[path] !== undefined) tg.BackButton.hide(); else tg.BackButton.show();
  }

  function navBar(active) {
    const item = (id, href, ic, label) => h("a", { href, class: active === id ? "active" : "", "aria-label": label }, icon(ic), h("span", { text: label }));
    return h("nav", { class: "nav" },
      item("home", "#/", "home", T("nav_home")), item("browse", "#/browse", "search", T("nav_browse")),
      item("library", "#/library", "library", T("nav_library")), item("settings", "#/settings", "settings", T("nav_settings")));
  }
  function render(nodes, navActive) {
    $root.replaceChildren(...[].concat(nodes), ...(navActive ? [navBar(navActive)] : []));
    const bar = $root.querySelector(".topbar");
    if (bar) { const on = () => bar.classList.toggle("scrolled", window.scrollY > 4); on(); window.onscroll = on; }
  }
  function page({ title, back, right, body, brand }) {
    const bell = () => h("a", { class: "icon-btn", href: "#/notifications", "aria-label": T("notif_title") }, icon("bell"), state.unread > 0 ? h("span", { class: "dot" }) : null);
    const top = h("header", { class: "topbar" },
      back ? h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_back"), onclick: goBack }, icon("back")) : null,
      brand ? h("div", { class: "brand" }, h("img", { src: "assets/logo.svg", alt: "" }), h("div", {}, h("b", { text: "Nexa Manga" }), h("small", { text: T("made_by") }))) : h("h1", { text: title }),
      right === "bell" ? bell() : right || null);
    return [top, h("main", {}, body)];
  }

  /* ------------------------------------------------------------------ HOME */
  async function home(ctx) {
    const heroSkel = h("div", { class: "skel" });
    heroSkel.style.height = "196px";
    render(page({ brand: true, right: "bell", body: [heroSkel, ...skel(3, 70)] }), "home");
    const [mangas, updates, cats, unread] = await Promise.all([
      Api.get("/mangas", { per_page: 12, sort: "latest" }),
      Api.get("/chapters/latest", { per_page: 10 }),
      Api.get("/categories"),
      Api.get("/notifications/me/unread-count").catch(() => ({ unread: 0 })),
    ]);
    if (!ctx.ok()) return;
    state.unread = unread.unread || 0;
    const items = mangas.items || [];
    const body = [];

    if (!items.length) body.push(empty("book", T("home_empty_title"), T("home_empty_body")));
    else {
      body.push(h("div", { class: "hero" }, items.slice(0, 4).map((m, i) => {
        const url = safeImg(m.banner_url) || safeImg(m.cover_url);
        const card = h("a", { class: "hero-card", href: `#/manga/${m.id}` });
        if (url) card.append(h("img", { src: url, alt: "", decoding: "async", referrerpolicy: "no-referrer" }));
        else { const bg = h("div", { class: "bg" }); bg.style.background = gradient(m.id); card.append(bg); }
        card.append(h("div", {}, i === 0 ? h("span", { class: "hero-tag", text: T("new_badge") }) : null,
          h("h3", { text: m.title }), h("p", { text: m.description || "" }),
          h("span", { class: "btn btn-primary btn-sm" }, icon("play", "fill"), T("start_reading"))));
        return card;
      })));
    }

    const hist = Lib.histList().slice(0, 10);
    if (hist.length) {
      body.push(h("section", { class: "section" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_continue") }), h("a", { href: "#/library/history", text: T("see_all") })),
        h("div", { class: "row-scroll" }, hist.map((e) => h("a", { class: "mcard", href: `#/read/${e.chapterId}` },
          cover(e.m), h("div", { class: "t", text: e.m.title }), h("div", { class: "s", text: T("ch_short", { n: num(e.number) }) }),
          h("div", { class: "progress" }, h("i", { style: `width:${e.total ? Math.max(4, Math.round((e.page / e.total) * 100)) : 4}%` })))))));
    }

    if (Array.isArray(cats) && cats.length) {
      body.push(h("section", { class: "section" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_categories") })),
        h("div", { class: "chips" }, cats.map((c) => h("a", { class: "chip", href: `#/browse?cat=${c.id}`, text: c.name })))));
    }

    const ups = updates.items || [];
    if (ups.length) {
      body.push(h("section", { class: "section" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_updates") })),
        h("div", { class: "list" }, ups.map((c) => h("a", { class: "item", href: `#/read/${c.id}` },
          h("div", { class: "thumb" }, cover(c.manga || { title: "?" })),
          h("div", { class: "body" }, h("b", { text: c.manga ? c.manga.title : "" }),
            h("span", { text: `${T("chapter_n", { n: num(c.number) })} · ${timeAgo(c.published_at || c.created_at)}` })),
          icon("chevron"))))));
    }

    if (items.length > 4) {
      body.push(h("section", { class: "section" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_new") }), h("a", { href: "#/browse", text: T("see_all") })),
        h("div", { class: "grid" }, items.slice(4).map((m) => mangaCard(m)))));
    }
    render(page({ brand: true, right: "bell", body }), "home");
  }

  /* ------------------------------------------------------------------ BROWSE */
  async function browse(ctx) {
    let q = ctx.q.get("q") || "", cat = ctx.q.get("cat") || "", sort = ctx.q.get("sort") || "latest", pageNo = 1, busy = false;
    const cats = await Api.get("/categories");
    if (!ctx.ok()) return;

    const input = h("input", { type: "search", placeholder: T("search_placeholder"), value: q, enterkeyhint: "search", autocomplete: "off", maxlength: "100" });
    const chips = h("div", { class: "chips" });
    const seg = h("div", { class: "seg" });
    const results = h("div", { class: "grid" });
    const more = h("button", { class: "btn btn-block", type: "button", text: T("load_more"), onclick: () => load(false) });
    const info = h("div");

    function paint() {
      chips.replaceChildren(
        h("button", { class: "chip" + (!cat ? " on" : ""), type: "button", text: T("all"), onclick: () => { cat = ""; refresh(); } }),
        ...cats.map((c) => h("button", { class: "chip" + (String(c.id) === String(cat) ? " on" : ""), type: "button", text: c.name, onclick: () => { cat = String(c.id); refresh(); } })));
      seg.replaceChildren(...[["latest", "sort_latest"], ["updated", "sort_updated"], ["title", "sort_title"]].map(([id, k]) =>
        h("button", { class: sort === id ? "on" : "", type: "button", text: T(k), onclick: () => { sort = id; refresh(); } })));
    }
    function syncUrl() {
      const p = new URLSearchParams();
      if (q) p.set("q", q); if (cat) p.set("cat", cat); if (sort !== "latest") p.set("sort", sort);
      history.replaceState(null, "", "#/browse" + (p.toString() ? "?" + p : ""));
    }
    async function load(reset) {
      if (busy) return;
      busy = true;
      if (reset) { pageNo = 1; results.replaceChildren(...skel(6, 190)); info.replaceChildren(); more.classList.add("hidden"); }
      try {
        const r = await Api.get("/mangas", { q, category_id: cat, sort, page: pageNo, per_page: 18 });
        if (!ctx.ok()) return;
        if (reset) results.replaceChildren();
        (r.items || []).forEach((m) => results.append(mangaCard(m)));
        if (reset && !(r.items || []).length) info.replaceChildren(empty("search", T("no_results"), T("no_results_body")));
        more.classList.toggle("hidden", pageNo >= r.total_pages);
        pageNo += 1;
      } catch (e) {
        if (reset) results.replaceChildren();
        info.replaceChildren(empty("info", T("error_title"), T("error_body")));
      } finally { busy = false; }
    }
    function refresh() { haptic("light"); paint(); syncUrl(); load(true); }
    let timer;
    input.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { q = input.value.trim(); syncUrl(); load(true); }, 350); });

    paint();
    render(page({ title: T("nav_browse"), body: [
      h("div", { class: "search" }, icon("search"), input),
      h("div", { style: "margin-top:12px" }, chips),
      h("div", { style: "margin-top:12px" }, seg),
      h("div", { style: "margin-top:16px" }, results), info,
      h("div", { style: "margin-top:16px" }, more)] }), "browse");
    load(true);
  }

  /* ------------------------------------------------------------------ MANGA */
  async function mangaPage(ctx) {
    const id = Number(ctx.params[0]);
    render(page({ title: "", back: true, body: [h("div", { class: "m-head" }, ...skel(1, 177)), ...skel(4, 56)] }));
    const r = await Api.get("/mangas/" + id);
    if (!ctx.ok()) return;
    const m = r.manga;
    const chapters = m.chapters || [];
    let desc = true, newestFirst = true;
    const histEntry = Lib.entry(m.id);
    const readSet = new Set((histEntry && histEntry.read) || []);

    const favBtn = h("button", { class: "icon-btn", type: "button", style: "width:46px;height:46px" });
    const paintFav = () => { favBtn.replaceChildren(icon("heart", Lib.isFav(m.id) ? "fill" : "")); favBtn.style.color = Lib.isFav(m.id) ? "var(--danger)" : ""; favBtn.setAttribute("aria-label", Lib.isFav(m.id) ? T("remove_favorite") : T("add_favorite")); };
    favBtn.addEventListener("click", () => { const on = Lib.toggleFav(m); paintFav(); haptic("medium"); toast(T(on ? "fav_added" : "fav_removed")); });
    paintFav();

    const first = chapters[0];
    const resume = histEntry && chapters.find((c) => c.id === histEntry.chapterId);
    const cta = chapters.length
      ? h("a", { class: "btn btn-primary", href: `#/read/${(resume || first).id}` }, icon("play", "fill"),
          resume ? T("continue_reading", { n: num(resume.number) }) : T("start_reading"))
      : h("div", { class: "btn", style: "flex:1", text: T("no_chapters") });

    const descEl = h("p", { class: "desc clamp", text: m.description || T("no_description") });
    const toggle = h("button", { class: "link", type: "button", text: T("read_more"), style: "margin-top:6px", onclick: () => {
      desc = !desc; descEl.classList.toggle("clamp", desc); toggle.textContent = T(desc ? "read_more" : "read_less"); } });

    const list = h("div");
    const paintChapters = () => {
      const rows = newestFirst ? [...chapters].reverse() : chapters;
      list.replaceChildren(...(rows.length ? rows.map((c) => h("a", { class: "chap" + (readSet.has(c.id) ? " read" : ""), href: `#/read/${c.id}` },
        h("div", {}, h("b", { text: T("chapter_n", { n: num(c.number) }) + (c.title ? " — " + c.title : "") }), h("small", { text: timeAgo(c.published_at) })),
        histEntry && histEntry.chapterId === c.id ? h("span", { class: "state", text: "●" }) : icon("chevron"))) : [empty("book", T("no_chapters"))]));
    };
    paintChapters();
    const orderBtn = h("button", { class: "link", type: "button", onclick: () => { newestFirst = !newestFirst; orderBtn.replaceChildren(icon("sort"), " " + T(newestFirst ? "order_desc" : "order_asc")); paintChapters(); } });
    orderBtn.append(icon("sort"), " " + T("order_desc"));

    const commentsBox = h("div", {}, ...skel(2, 60));
    const body = [
      h("div", { class: "m-head" }, cover(m),
        h("div", { style: "min-width:0;flex:1" }, h("h2", { text: m.title }),
          h("div", { class: "m-meta" },
            m.category ? h("span", { class: "tag", text: m.category.name }) : null,
            statusTag(m.status) ? h("span", { class: "tag " + (m.status === "completed" ? "ok" : "warn"), text: statusTag(m.status) }) : null,
            h("span", { class: "tag", text: `${chapters.length} ${T("chapters").toLowerCase()}` })))),
      h("div", { class: "m-actions" }, cta, favBtn),
      h("section", { class: "section" }, descEl, (m.description || "").length > 160 ? toggle : null),
      h("section", { class: "section" }, h("div", { class: "section-head" }, h("h2", { text: T("chapters") }), chapters.length > 1 ? orderBtn : null), list),
      h("section", { class: "section" }, h("div", { class: "section-head" }, h("h2", { text: T("comments") })), commentsBox),
    ];
    render(page({ title: m.title, back: true, body }));
    loadComments(m, commentsBox, ctx);
  }

  async function loadComments(manga, box, ctx) {
    const list = h("div");
    const area = h("textarea", { placeholder: T("comment_placeholder"), maxlength: "1000", rows: "2" });
    const send = h("button", { class: "btn btn-primary btn-sm", type: "button", text: T("post") });
    const addRow = (c) => {
      const mine = c.author && state.user && c.author.id === state.user.id;
      const row = h("div", { class: "comment" }, avatar(c.author),
        h("div", { style: "min-width:0;flex:1" },
          h("div", {}, h("span", { class: "who", text: mine ? T("you") : (c.author && c.author.name) || "—" }), h("span", { class: "when", text: timeAgo(c.created_at) })),
          h("p", { text: c.content }),
          h("div", { class: "acts" }, mine
            ? h("button", { type: "button", text: T("delete"), onclick: async () => { try { await Api.del("/comments/" + c.id); row.remove(); toast(T("comment_deleted")); } catch (_) { toast(T("comment_error")); } } })
            : h("button", { type: "button", text: T("report"), onclick: async (ev) => { try { await Api.post(`/comments/${c.id}/report`, {}); ev.currentTarget.disabled = true; toast(T("reported")); } catch (_) { toast(T("comment_error")); } } }))));
      return row;
    };
    let data;
    try { data = await Api.get("/comments", { manga_id: manga.id, per_page: 30 }); } catch (_) { data = { items: [] }; }
    if (!ctx.ok()) return;
    (data.items || []).forEach((c) => list.append(addRow(c)));
    if (!list.children.length) list.append(h("p", { class: "muted", style: "padding:10px 0", text: T("comment_empty") }));
    send.addEventListener("click", async () => {
      const content = area.value.trim();
      if (!content) return;
      send.setAttribute("disabled", "");
      try {
        const r = await Api.post("/comments", { manga_id: manga.id, content });
        if (list.firstChild && list.firstChild.tagName === "P") list.replaceChildren();
        list.prepend(addRow(r.comment)); area.value = ""; haptic("success"); toast(T("comment_sent"));
      } catch (_) { haptic("error"); toast(T("comment_error")); }
      send.removeAttribute("disabled");
    });
    box.replaceChildren(h("div", { style: "display:grid;gap:8px" }, area, h("div", { style: "text-align:right" }, send)), list);
  }

  /* ------------------------------------------------------------------ READER */
  async function reader(ctx) {
    const id = Number(ctx.params[0]);
    screen({ spinner: true });
    const r = await Api.get(`/chapters/${id}/read`);
    if (!ctx.ok()) return;
    const ch = r.chapter, manga = r.manga || { id: ch.manga_id, title: "" };
    const pages = (ch.pages || []).map(safeImg).filter(Boolean);
    document.body.style.overflow = "hidden";
    if (tg && tg.BackButton) { tg.BackButton.show(); }

    const prog = h("div", { class: "reader-progress" });
    const label = h("span", { text: "" });
    const scroller = h("div", { class: "reader immersive" });
    const goManga = () => go(`#/manga/${manga.id}`);
    const navTo = (cid) => location.replace(location.pathname + location.search + `#/read/${cid}`);

    const top = h("div", { class: "reader-bar top" },
      h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_back"), onclick: goManga }, icon("back")),
      h("div", { class: "ttl" }, h("b", { text: manga.title }), h("span", { text: T("chapter_n", { n: num(ch.number) }) + (ch.title ? " — " + ch.title : "") })));
    const prev = h("button", { class: "btn", type: "button", disabled: r.prev_id ? null : true, onclick: () => r.prev_id && navTo(r.prev_id) }, icon("back"), T("reader_prev"));
    const next = h("button", { class: "btn", type: "button", disabled: r.next_id ? null : true, onclick: () => r.next_id && navTo(r.next_id) }, T("reader_next"), icon("chevron"));
    const bottom = h("div", { class: "reader-bar bottom" }, prev, label, next);

    const holder = h("div", { class: "pages" });
    const els = pages.map((url, i) => {
      const box = h("div", { class: "page" });
      const load = () => {
        box.querySelector(".retry")?.remove();
        const img = h("img", { src: url + (box.dataset.retry ? (url.includes("?") ? "&" : "?") + "r=" + box.dataset.retry : ""), alt: `${i + 1}`, decoding: "async", loading: i < 3 ? "eager" : "lazy", referrerpolicy: "no-referrer" });
        img.addEventListener("load", () => box.classList.add("loaded"));
        img.addEventListener("error", () => {
          img.remove();
          box.append(h("div", { class: "retry" }, h("span", { text: T("reader_error") }),
            h("button", { class: "btn btn-sm", type: "button", text: T("retry"), onclick: (ev) => { ev.stopPropagation(); box.dataset.retry = Date.now(); load(); } })));
        });
        box.append(img);
      };
      load();
      return box;
    });
    els.forEach((b) => holder.append(b));
    if (!pages.length) holder.append(h("div", { class: "empty", style: "padding-top:120px" }, icon("book"), h("b", { text: T("reader_empty") })));

    const end = h("div", { class: "reader-end" }, h("b", { text: r.next_id ? T("reader_end_title") : T("reader_last") }),
      r.next_id ? h("button", { class: "btn btn-primary", type: "button", onclick: () => navTo(r.next_id) }, T("reader_next"), icon("chevron")) : null,
      h("button", { class: "btn", type: "button", onclick: goManga, text: T("reader_back") }));
    scroller.append(holder, end);
    $root.replaceChildren(prog, top, scroller, bottom);

    let lastSave = 0, ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const max = scroller.scrollHeight - scroller.clientHeight;
        prog.style.width = (max > 0 ? Math.min(100, (scroller.scrollTop / max) * 100) : 0) + "%";
        let idx = 0;
        for (let i = 0; i < els.length; i++) if (els[i].offsetTop <= scroller.scrollTop + scroller.clientHeight * 0.4) idx = i;
        const total = els.length;
        const pageNo = max > 0 && scroller.scrollTop >= max - 8 ? total : idx + 1;
        label.textContent = total ? T("reader_page", { a: pageNo, b: total }) : "";
        if (Date.now() - lastSave > 1200) { lastSave = Date.now(); Lib.touch(manga, ch, pageNo, total); }
      });
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    scroller.addEventListener("click", (ev) => { if (!ev.target.closest("button")) scroller.classList.toggle("immersive"); });
    Lib.touch(manga, ch, 1, els.length);
    onScroll();
    setTimeout(() => scroller.classList.remove("immersive"), 150);
  }

  /* ------------------------------------------------------------------ LIBRARY */
  async function library(ctx) {
    let tab = ctx.params[0] || "favorites";
    const body = h("div");
    const seg = h("div", { class: "seg" });
    function paint() {
      seg.replaceChildren(...[["favorites", "favorites"], ["history", "history"]].map(([id, k]) =>
        h("button", { class: tab === id ? "on" : "", type: "button", text: T(k), onclick: () => { tab = id; history.replaceState(null, "", "#/library/" + id); paint(); } })));
      if (tab === "favorites") {
        const f = Lib.favs();
        body.replaceChildren(f.length ? h("div", { class: "grid" }, f.map((m) => mangaCard(m, { sub: "" }))) : empty("heart", T("fav_empty_title"), T("fav_empty_body")));
      } else {
        const hl = Lib.histList();
        body.replaceChildren(hl.length ? h("div", { class: "list" }, hl.map((e) => h("a", { class: "item", href: `#/read/${e.chapterId}` },
          h("div", { class: "thumb" }, cover(e.m)),
          h("div", { class: "body" }, h("b", { text: e.m.title }), h("span", { text: `${T("chapter_n", { n: num(e.number) })} · ${timeAgo(new Date(e.at).toISOString())}` }),
            h("div", { class: "progress" }, h("i", { style: `width:${e.total ? Math.max(4, Math.round((e.page / e.total) * 100)) : 4}%` }))),
          icon("chevron")))) : empty("library", T("hist_empty_title"), T("hist_empty_body")));
      }
    }
    paint();
    render(page({ title: T("nav_library"), body: [seg, h("div", { style: "margin-top:16px" }, body)] }), "library");
  }

  /* ------------------------------------------------------------------ NOTIFICATIONS */
  async function notifications(ctx) {
    render(page({ title: T("notif_title"), back: true, body: skel(4, 66) }));
    const r = await Api.get("/notifications/me", { per_page: 50 });
    if (!ctx.ok()) return;
    const items = r.items || [];
    const right = items.some((n) => !n.is_read)
      ? h("button", { class: "icon-btn", type: "button", "aria-label": T("mark_all_read"), onclick: async () => { await Api.patch("/notifications/me/read-all").catch(() => {}); state.unread = 0; navigate(); } }, icon("check")) : null;
    render(page({ title: T("notif_title"), back: true, right, body: items.length
      ? h("div", { class: "list" }, items.map((n) => h("div", { class: "item" + (n.is_read ? "" : " unread") },
        h("div", { class: "body", style: "white-space:normal" }, h("b", { text: n.title, style: "white-space:normal" }),
          h("span", { text: n.message, style: "display:block;margin-top:2px;color:var(--text);opacity:.85" }), h("span", { text: timeAgo(n.created_at) })))))
      : empty("bell", T("notif_empty_title"), T("notif_empty_body")) }));
  }

  /* ------------------------------------------------------------------ SETTINGS */
  let versionTaps = 0, versionTimer;
  async function openAdmin() {
    // The server decides who is admin (is_admin). Anyone else: nothing visible happens.
    try {
      const r = await Api.me();
      if (r.user && r.user.is_admin) { haptic("success"); toast(T("admin_mode")); setTimeout(() => { location.href = "admin/index.html"; }, 350); }
    } catch (_) { /* silent */ }
  }
  function onVersionTap() {
    haptic("light");
    versionTaps += 1;
    clearTimeout(versionTimer);
    versionTimer = setTimeout(() => { versionTaps = 0; }, 2500);
    if (versionTaps >= 5) { versionTaps = 0; openAdmin(); }
  }

  async function settings(ctx) {
    const u = state.user || {};
    const showName = u.username && !/^tg_\d+$/.test(u.username) ? "@" + u.username : "";
    const langPref = I18n.pref(), themePref = Theme.pref();
    const seg = (opts, cur, onPick) => h("div", { class: "seg", style: "margin:14px" }, opts.map(([id, label]) =>
      h("button", { class: cur === id ? "on" : "", type: "button", text: label, onclick: () => { haptic("light"); onPick(id); } })));

    const tile = (id, colors, label, on) => h("button", { class: "tile" + (on ? " on" : ""), type: "button", onclick: () => { haptic("light"); Theme.set(id); navigate(); } },
      h("div", { class: "sw" }, colors.map((c) => { const i = h("i"); i.style.background = c; return i; })), label);
    const autoColors = ["#0b0b14", "#f4f5fb", "#7c5cff"];

    const cell = (ic, label, val, onClick) => h(onClick ? "button" : "div", { class: "cell", type: onClick ? "button" : null, onclick: onClick },
      icon(ic), h("span", { class: "grow", text: label }), val ? h("span", { class: "val", text: val }) : null, onClick ? icon("chevron") : null);

    const body = [
      h("div", { class: "card profile" }, avatar(u), h("div", {}, h("b", { text: u.name || "—" }),
        h("span", { class: "muted", text: showName ? showName + " · " + T("member") : T("member") }))),

      h("div", { class: "group" }, h("h3", { text: T("language") }), h("div", { class: "card" },
        seg([["auto", T("lang_auto")], ["fr", T("lang_fr")], ["en", T("lang_en")]], langPref, (id) => { I18n.setPref(id); navigate(); }))),

      h("div", { class: "group" }, h("h3", { text: T("theme") }), h("div", { class: "card themes" },
        tile("auto", autoColors, T("theme_auto"), themePref === "auto"),
        ...Theme.THEMES.map((th) => tile(th.id, th.colors, T("theme_" + th.id), themePref === th.id)))),

      h("div", { class: "group" }, h("h3", { text: T("library") }), h("div", { class: "card" },
        cell("trash", T("clear_history"), "", async () => { if (await askConfirm(T("confirm_clear"))) { Lib.clear("hist"); toast(T("cleared")); } }),
        cell("heart", T("clear_favorites"), "", async () => { if (await askConfirm(T("confirm_clear"))) { Lib.clear("fav"); toast(T("cleared")); } }))),

      h("div", { class: "group" }, h("h3", { text: T("community") }), h("div", { class: "card" },
        cell("send", T("nexa_channel"), cfg.channel, () => openLink(cfg.channelUrl)))),

      h("div", { class: "group" }, h("h3", { text: T("about") }), h("div", { class: "card" },
        h("div", { class: "about" }, h("img", { src: "assets/logo.svg", alt: "Nexa" }), h("b", { text: "Nexa Manga" }),
          h("p", { class: "muted", text: T("made_by") + " · " + cfg.channel })),
        h("div", { class: "cell press", role: "button", tabindex: "0", onclick: onVersionTap },
          icon("info"), h("span", { class: "grow", text: T("version") }), h("span", { class: "val", text: cfg.version })))),
    ];
    render(page({ title: T("settings_title"), body }), "settings");
  }

  /* ------------------------------------------------------------------ boot */
  function start() {
    if (tg && tg.BackButton) { tg.BackButton.offClick && tg.BackButton.offClick(onBack); tg.BackButton.onClick(onBack); }
    window.removeEventListener("hashchange", navigate);
    window.addEventListener("hashchange", navigate);
    navigate();
  }
  function onBack() {
    const { path } = parseHash();
    const m = path.match(/^\/read\/\d+$/);
    if (m) { const e = document.querySelector(".reader-bar.top .icon-btn"); if (e) return e.click(); }
    goBack();
  }

  async function boot() {
    if (tg) { try { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {} }
    Theme.apply(); I18n.apply();
    if (!Api.initData()) return screen({ title: T("tg_only_title"), body: T("tg_only_body") });
    screen({ spinner: true });
    try { await authenticate(); } catch (e) { return authError(e); }
    start();
  }

  if (tg && tg.onEvent) tg.onEvent("themeChanged", () => Theme.apply());
  boot();
})();
