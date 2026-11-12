/* Manga Gallery FR - views: home, browse, manga, library, notifications, settings. Data always comes from the backend. */
(function () {
  "use strict";
  const { h, icon, T, safeImg, haptic, toast, askConfirm, openLink, timeAgo, isRecent, num, gradient, statusTag, throttle, lazyImg,
    cover, mangaCard, avatar, empty, skel, segmented } = UI;
  const cfg = window.NEXA_CONFIG;
  const sh = () => Nexa.shell;
  const reduce = FX.reduce;
  const stagger = (nodes, max = 14) => nodes.map((n, i) => { n.style.setProperty("--i", Math.min(i, max)); return n; });
  const centerOf = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };

  /* ================================================================== HOME */
  function heroCarousel(items) {
    const DUR = 5200;
    const hero = h("div", { class: "hero" });
    const dots = h("div", { class: "hero-dots" });
    dots.style.setProperty("--dur", DUR + "ms");
    const cards = items.map((m, i) => {
      const url = safeImg(m.banner_url) || safeImg(m.cover_url);
      const card = h("a", { class: "hero-card", href: `#/manga/${m.id}` });
      if (url) { const img = lazyImg(url, "", { loading: "eager" }); img.addEventListener("error", () => img.remove()); card.append(img); }
      const bg = h("div", { class: "bg" }); bg.style.background = gradient(m.id); card.prepend(bg);
      card.append(h("div", { class: "txt" },
        h("span", { class: "hero-tag" }, icon("sparkles"), i === 0 ? T("new_badge") : (m.category ? m.category.name : T("status_ongoing"))),
        h("h3", { text: m.title }), h("p", { text: m.description || "" }),
        h("span", { class: "btn btn-primary btn-sm" }, icon("play", "fill"), T("start_reading"))));
      return card;
    });
    const dotBtns = items.map((_, i) => h("button", { type: "button", "aria-label": String(i + 1), onclick: () => setActive(i, true) }));
    hero.append(...cards); dots.append(...dotBtns);
    let idx = 0, timer, paused = false;
    function setActive(i, scroll) {
      idx = i;
      cards.forEach((c, k) => c.classList.toggle("active", k === i));
      dotBtns.forEach((b, k) => { b.classList.toggle("on", k === i); b.replaceChildren(k === i ? h("i") : ""); });
      if (scroll) hero.scrollTo({ left: cards[i].offsetLeft - (hero.clientWidth - cards[i].clientWidth) / 2, behavior: "smooth" });
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (cards.length < 2) return;
      timer = setTimeout(() => { if (!document.body.contains(hero)) return; if (document.hidden || paused) schedule(); else setActive((idx + 1) % cards.length, true); }, DUR);
    }
    const onScroll = throttle(() => {
      const mid = hero.scrollLeft + hero.clientWidth / 2;
      let best = 0, bd = 1e9;
      cards.forEach((c, k) => { const d = c.offsetLeft + c.clientWidth / 2 - mid; c.style.setProperty("--ox", (-d * .09).toFixed(1) + "px"); if (Math.abs(d) < bd) { bd = Math.abs(d); best = k; } });
      if (best !== idx) setActive(best, false);
    }, 40);
    hero.addEventListener("scroll", onScroll, { passive: true });
    hero.addEventListener("touchstart", () => { paused = true; hero.classList.add("paused"); }, { passive: true });
    hero.addEventListener("touchend", () => { paused = false; hero.classList.remove("paused"); schedule(); }, { passive: true });
    requestAnimationFrame(() => setActive(0, false));
    sh().onLeave(() => clearTimeout(timer));
    return h("div", { class: "hero-wrap" }, hero, cards.length > 1 ? dots : null);
  }

  let randomPool = { at: 0, items: [] };
  async function surprise(ev) {
    const [x, y] = centerOf(ev.currentTarget);
    FX.burst(x, y, { count: 22, colors: ["#7c5cff", "#22d3ee", "#ffd166", "#ff5d8f"] });
    haptic("medium");
    try {
      if (Date.now() - randomPool.at > 300000) randomPool = { at: Date.now(), items: (await Api.get("/mangas", { per_page: 100, sort: "latest", section: "normal" })).items || [] };
      if (!randomPool.items.length) return toast(T("home_empty_title"));
      const m = randomPool.items[Math.floor(Math.random() * randomPool.items.length)];
      setTimeout(() => sh().go(`#/manga/${m.id}`), 260);
    } catch (_) { toast(T("error_body")); }
  }

  async function home(ctx) {
    const S = sh(), user = S.state.user || {};
    if (!ctx.silent) {
      const hs = h("div", { class: "skel" }); hs.style.height = "232px";
      S.render(S.page({ brand: true, right: "bell", body: [hs, ...skel(2, 84)] }), { tab: "home" });
    }
    const R = await Promise.allSettled([Api.get("/mangas", { per_page: 12, sort: "latest", section: "normal" }), Api.get("/chapters/latest", { per_page: 10, section: "normal" }),
      Api.get("/categories"), Api.get("/notifications/me/unread-count")]);
    if (!ctx.ok()) return;
    if (R[0].status === "rejected" && R[1].status === "rejected") throw R[0].reason;
    const val = (i, d) => (R[i].status === "fulfilled" ? R[i].value : d);
    const items = val(0, {}).items || [], ups = val(1, {}).items || [], cats = val(2, []);
    S.state.unread = val(3, {}).unread || 0;

    const body = [];
    const first = (user.name || "").split(" ")[0];
    body.push(h("div", { class: "section", style: "margin-top:6px" },
      h("h2", { style: "font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.15" }, T("hello", { name: first || "" }), " ", h("span", { text: "👋" })),
      h("p", { class: "muted", style: "margin-top:2px", text: T("tagline_home") })));

    if (items.length) body.push(heroCarousel(items.slice(0, 5)));
    else body.push(empty("book", T("home_empty_title"), T("home_empty_body")));

    body.push(scBanner());
    body.push(h("div", { class: "tiles section reveal", style: "margin-top:6px" },
      qtile("shuffle", T("surprise"), "#7c5cff", "#22d3ee", surprise),
      qtile("heart", T("favorites"), "#ff5d8f", "#ff9d5c", () => S.go("#/library/favorites")),
      qtile("search", T("tile_browse"), "#34d399", "#22d3ee", () => S.go("#/browse"))));

    const hist = Store.histList().filter((e) => !(e.manga && e.manga.section === "sainte_culture")).slice(0, 10);
    if (hist.length) {
      body.push(h("section", { class: "section reveal" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_continue") }), h("a", { class: "link", href: "#/library/history" }, T("see_all"), icon("chevron"))),
        h("div", { class: "row-scroll" }, hist.map((e) => h("a", { class: "mcard", href: `#/read/${e.chapter_id}` },
          h("div", { class: "tilt" }, cover(e.manga)), h("div", { class: "t", text: e.manga.title }), h("div", { class: "s", text: T("ch_short", { n: num(e.number) }) }),
          h("div", { class: "progress" }, h("i", { style: `width:${e.total ? Math.max(5, Math.round((e.page / e.total) * 100)) : 5}%` })))))));
    }
    if (Array.isArray(cats) && cats.length) {
      body.push(h("section", { class: "section reveal" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_categories") })),
        h("div", { class: "chips" }, cats.map((c) => { const a = h("a", { class: "chip", href: `#/browse?cat=${c.id}` }, h("i", { class: "dotc" }), c.name); a.style.setProperty("--c", /^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "var(--accent)"); return a; }))));
    }
    if (ups.length) {
      body.push(h("section", { class: "section reveal" },
        h("div", { class: "section-head" }, h("h2", { text: T("home_updates") })),
        h("div", { class: "list" }, ups.map((c) => h("a", { class: "item", href: `#/read/${c.id}` },
          h("div", { class: "thumb" }, cover(c.manga || { title: "?" })),
          h("div", { class: "body" }, h("b", { text: c.manga ? c.manga.title : "" }),
            h("span", { text: `${T("chapter_n", { n: num(c.number) })} · ${timeAgo(c.published_at || c.created_at)}` })),
          isRecent(c.published_at || c.created_at) ? h("span", { class: "pill-new", text: T("new_pill") }) : icon("chevron"))))));
    }
    if (items.length > 4) {
      body.push(h("section", { class: "section" },
        h("div", { class: "section-head reveal" }, h("h2", { text: T("home_new") }), h("a", { class: "link", href: "#/browse" }, T("see_all"), icon("chevron"))),
        h("div", { class: "grid" }, items.slice(4).map((m, i) => mangaCard(m, { delay: i % 6 })))));
    }
    S.render(S.page({ brand: true, right: "bell", body }), { tab: "home", refresh: () => home({ ...ctx, silent: true }) });
  }
  /* ---- La Sainte Culture (18+) */
  const adultOk = () => { const u = sh().state.user || {}; return !!(u.adult_confirmed || u.is_admin); };
  function scBanner() {
    return h("a", { class: "sc-banner reveal", href: "#/sainte-culture" },
      h("span", { class: "sc-ico" }, icon("flame")),
      h("div", { class: "sc-txt" }, h("b", { text: T("sc_name") }), h("span", { text: T("sc_banner_body") })),
      h("span", { class: "sc-18", text: T("adult_badge") }), icon("chevron"));
  }
  function adultGate() {
    const S = sh();
    const ok = h("button", { class: "btn btn-primary", type: "button", onclick: async (ev) => {
      const b = ev.currentTarget; b.setAttribute("disabled", "");
      try { const r = await Api.post("/auth/adult-confirm", { confirm: true }); S.state.user = r.user; haptic("success"); toast(T("adult_ok")); S.navigate(); }
      catch (_) { b.removeAttribute("disabled"); haptic("error"); toast(T("adult_error")); }
    } }, icon("check"), T("adult_confirm"));
    const back = h("button", { class: "btn", type: "button", onclick: () => S.go("#/") }, icon("back"), T("adult_decline"));
    S.render([h("div", { class: "screen adult-gate" },
      h("div", { class: "adult-seal" }, icon("flame"), h("b", { text: T("adult_badge") })),
      h("h1", { text: T("sc_name") }), h("p", { class: "sc-sub", text: T("adult_gate_title") }),
      h("p", { text: T("adult_gate_body") }), h("div", { class: "btns" }, ok, back))], { hideNav: true });
  }
  function qtile(ic, label, c1, c2, onClick) {
    const t = h("button", { class: "qtile", type: "button", onclick: onClick }, h("span", { class: "ico" }, icon(ic)), label);
    t.style.setProperty("--c1", c1); t.style.setProperty("--c2", c2);
    return t;
  }

  /* ================================================================== BROWSE */
  const browse = (ctx) => browseSection(ctx, "normal");
  const sainteCulture = (ctx) => browseSection(ctx, "sainte_culture");
  async function browseSection(ctx, section) {
    const S = sh(), adult = section === "sainte_culture";
    if (adult && !adultOk()) return adultGate();
    const TYPES = adult ? ["webtoon", "comic"] : ["manga", "webtoon", "comic"];
    let type = TYPES.includes(ctx.q.get("type")) ? ctx.q.get("type") : "";
    let q = ctx.q.get("q") || "", cat = ctx.q.get("cat") || "", sort = ctx.q.get("sort") || "latest", pageNo = 1, busy = false, token = 0;
    let mode = (() => { try { return localStorage.getItem("nexa:view") || "grid"; } catch (_) { return "grid"; } })();
    const cats = await Api.get("/categories");
    if (!ctx.ok()) return;

    const input = h("input", { type: "search", placeholder: T(adult ? "sc_search" : "search_placeholder"), value: q, enterkeyhint: "search", autocomplete: "off", maxlength: "100", "aria-label": T("nav_browse") });
    const clear = h("button", { class: "clear", type: "button", "aria-label": T("close"), onclick: () => { input.value = ""; q = ""; box.classList.remove("has"); input.focus(); syncUrl(); load(true); } }, icon("x"));
    const box = h("div", { class: "search" + (q ? " has" : "") }, icon("search"), input, clear);
    const chips = h("div", { class: "chips" });
    const typeChips = h("div", { class: "chips" });
    const paintTypes = () => typeChips.replaceChildren(...[["", T("type_all")], ...TYPES.map((t) => [t, T("type_" + t)])].map(([id, label]) =>
      h("button", { class: "chip" + (type === id ? " on" : ""), type: "button", text: label, onclick: () => { type = id; haptic("select"); paintTypes(); syncUrl(); load(true); } })));
    const sortSeg = segmented([["latest", T("sort_latest")], ["updated", T("sort_updated")], ["title", T("sort_title")]], sort, (id) => { sort = id; syncUrl(); load(true); });
    const results = h("div");
    const info = h("div");
    const more = h("button", { class: "btn btn-block", type: "button", text: T("load_more"), onclick: () => load(false) });
    const viewBtn = h("button", { class: "icon-btn", type: "button", "aria-label": T("view_list"), onclick: () => { mode = mode === "grid" ? "list" : "grid"; try { localStorage.setItem("nexa:view", mode); } catch (_) {} haptic("select"); paintView(); load(true); } });
    const paintView = () => { viewBtn.replaceChildren(icon(mode === "grid" ? "rows" : "grid")); results.className = mode === "grid" ? "grid" : "list"; };

    function paintChips() {
      chips.replaceChildren(h("button", { class: "chip" + (!cat ? " on" : ""), type: "button", text: T("all"), onclick: () => pick("") }),
        ...cats.map((c) => { const b = h("button", { class: "chip" + (String(c.id) === String(cat) ? " on" : ""), type: "button", onclick: () => pick(String(c.id)) }, h("i", { class: "dotc" }), c.name); b.style.setProperty("--c", /^#[0-9a-f]{6}$/i.test(c.color || "") ? c.color : "var(--accent)"); return b; }));
    }
    function pick(id) { cat = id; haptic("select"); paintChips(); syncUrl(); load(true); }
    function syncUrl() {
      const p = new URLSearchParams();
      if (q) p.set("q", q); if (cat) p.set("cat", cat); if (type) p.set("type", type); if (sort !== "latest") p.set("sort", sort);
      history.replaceState(null, "", (adult ? "#/sainte-culture" : "#/browse") + (p.toString() ? "?" + p : ""));
    }
    const row = (m) => h("a", { class: "item reveal", href: `#/manga/${m.id}` }, h("div", { class: "thumb" }, cover(m)),
      h("div", { class: "body" }, h("b", { text: m.title }), h("span", { text: [m.category && m.category.name, statusTag(m.status), `${m.chapters_count || 0} ${T("chapters").toLowerCase()}`].filter(Boolean).join(" · ") })), icon("chevron"));

    async function load(reset) {
      if (busy && !reset) return;
      const my = ++token; busy = true;
      if (reset) { pageNo = 1; info.replaceChildren(); more.classList.add("hidden"); results.replaceChildren(...(mode === "grid" ? skel(6, 190) : skel(4, 82))); }
      more.setAttribute("disabled", "");
      try {
        const r = await Api.get("/mangas", { q, category_id: cat, type, section, sort, page: pageNo, per_page: 18 });
        if (my !== token || !ctx.ok()) return;
        if (reset) results.replaceChildren();
        const rows = (r.items || []).map((m, i) => (mode === "grid" ? mangaCard(m, { delay: i % 6 }) : row(m)));
        results.append(...rows); FX.reveal(results);
        if (reset && !rows.length) info.replaceChildren(adult && !q && !cat && !type ? empty("flame", T("sc_empty_title"), T("sc_empty_body")) : empty("search", T("no_results"), T("no_results_body")));
        more.classList.toggle("hidden", pageNo >= (r.total_pages || 1));
        pageNo += 1;
      } catch (e) {
        if (my !== token) return;
        if (e && e.code === "ADULT_REQUIRED") return adultGate();
        if (reset) results.replaceChildren();
        info.replaceChildren(empty("info", T("error_title"), T("error_body"), h("button", { class: "btn btn-primary", type: "button", onclick: () => load(true) }, T("retry"))));
      } finally { if (my === token) { busy = false; more.removeAttribute("disabled"); } }
    }
    let timer;
    input.addEventListener("input", () => { box.classList.toggle("has", !!input.value); clearTimeout(timer); timer = setTimeout(() => { q = input.value.trim(); syncUrl(); load(true); }, 320); });

    paintChips(); paintView(); paintTypes();
    S.render(S.page({ title: adult ? T("sc_name") : T("nav_browse"), back: adult, right: viewBtn, body: [box,
      h("div", { style: "margin-top:12px" }, typeChips), h("div", { style: "margin-top:10px" }, chips), h("div", { style: "margin-top:12px" }, sortSeg),
      h("div", { style: "margin-top:18px" }, results), info, h("div", { style: "margin-top:18px" }, more)] }),
      { tab: adult ? null : "browse", refresh: () => load(true) });
    load(true);
  }

  /* ================================================================== MANGA */
  async function mangaPage(ctx) {
    const S = sh(), id = Number(ctx.params[0]);
    S.render(S.page({ title: "", back: true, body: [h("div", { class: "m-head" }, ...skel(1, 192)), ...skel(3, 60)] }), { tab: null });
    const r = await Api.get("/mangas/" + id);
    if (!ctx.ok()) return;
    const m = r.manga, chapters = m.chapters || [];
    const entryOf = () => Store.entry(m.id);
    let descClamp = true, newestFirst = true, tab = "chapters";
    const readSet = new Set((entryOf() && entryOf().read) || []);

    // blurred cover background with parallax
    const bgUrl = safeImg(m.banner_url) || safeImg(m.cover_url);
    const bg = h("div", { class: "m-bg" }, bgUrl ? h("img", { src: bgUrl, alt: "", referrerpolicy: "no-referrer" }) : h("div"));
    if (!bgUrl) bg.firstChild.style.background = gradient(m.id);
    const onScrollBg = throttle(() => bg.style.setProperty("--py", String(Math.min(window.scrollY * -.25, 0))), 16);
    window.addEventListener("scroll", onScrollBg, { passive: true });
    S.onLeave(() => window.removeEventListener("scroll", onScrollBg));

    const favBtn = h("button", { class: "icon-btn fav-btn", type: "button" });
    const paintFav = (pop) => { const on = Store.isFav(m.id); favBtn.classList.toggle("on", on); favBtn.replaceChildren(icon("heart", on ? "fill" : "")); favBtn.setAttribute("aria-label", T(on ? "remove_favorite" : "add_favorite")); if (!pop) favBtn.firstChild.style.animation = "none"; };
    favBtn.addEventListener("click", async () => {
      const [x, y] = centerOf(favBtn);
      try {
        const on = await Store.toggleFav(m);
        paintFav(true); haptic(on ? "success" : "light");
        if (on) FX.burst(x, y, { heart: true, count: 18 });
        toast(T(on ? "fav_added" : "fav_removed"));
      } catch (_) { paintFav(false); haptic("error"); toast(T("sync_error")); }
    });
    paintFav(false);

    const first = chapters[0], e0 = entryOf();
    const resume = e0 && chapters.find((c) => c.id === e0.chapter_id);
    const cta = chapters.length
      ? h("a", { class: "btn btn-primary", href: `#/read/${(resume || first).id}` }, icon("play", "fill"), resume ? T("continue_reading", { n: num(resume.number) }) : T("start_reading"))
      : h("div", { class: "btn", style: "flex:1", text: T("no_chapters") });

    const descEl = h("p", { class: "desc clamp", text: m.description || T("no_description") });
    const more = (m.description || "").length > 170 ? h("button", { class: "link", type: "button", style: "margin-top:8px", text: T("read_more"), onclick: () => { descClamp = !descClamp; descEl.classList.toggle("clamp", descClamp); more.textContent = T(descClamp ? "read_more" : "read_less"); } }) : null;

    const list = h("div");
    const paintChapters = () => {
      const rows = newestFirst ? [...chapters].reverse() : chapters;
      const cur = entryOf();
      list.replaceChildren(...(rows.length ? stagger(rows.map((c) => {
        const date = c.published_at;
        return h("a", { class: "chap" + (readSet.has(c.id) ? " read" : ""), href: `#/read/${c.id}` },
          h("div", {}, h("b", {}, T("chapter_n", { n: num(c.number) }) + (c.title ? " — " + c.title : ""), date && isRecent(date) ? h("span", { class: "pill-new", text: T("new_pill") }) : null), h("small", { text: timeAgo(date) })),
          h("div", { class: "state" }, cur && cur.chapter_id === c.id && !readSet.has(c.id) ? h("span", { text: `${cur.page}/${cur.total || "?"}` }) : null,
            readSet.has(c.id) ? icon("checkcircle", "check") : icon("chevron")));
      }), 12) : [empty("book", T("no_chapters"))]));
      list.classList.add("stagger");
    };
    paintChapters();
    const orderBtn = h("button", { class: "link", type: "button", onclick: () => { newestFirst = !newestFirst; haptic("select"); label(); paintChapters(); } });
    const label = () => orderBtn.replaceChildren(icon("sort"), T(newestFirst ? "order_desc" : "order_asc"));
    label();

    const chapPanel = h("div", {}, h("div", { style: "display:flex;justify-content:flex-end;margin-bottom:4px" }, chapters.length > 1 ? orderBtn : null), list);
    const comPanel = h("div", { class: "hidden" }, ...skel(2, 66));
    let commentsLoaded = false;
    const tabs = segmented([["chapters", T("tab_chapters")], ["comments", T("tab_comments")]], tab, (t) => {
      tab = t; chapPanel.classList.toggle("hidden", t !== "chapters"); comPanel.classList.toggle("hidden", t !== "comments");
      if (t === "comments" && !commentsLoaded) { commentsLoaded = true; loadComments(m, comPanel, ctx); }
    });

    const statVal = (v, lbl) => h("div", { class: "stat" }, h("b", { text: v }), h("span", { text: lbl }));
    const cnt = statVal("0", T("stat_chapters"));
    const lastDate = chapters.length ? chapters[chapters.length - 1].published_at : m.updated_at;
    const readCount = chapters.filter((c) => readSet.has(c.id)).length;

    const body = [
      bg,
      h("div", { class: "m-head" }, h("div", { class: "tilt-wrap" }, cover(m)),
        h("div", { style: "min-width:0;flex:1" }, h("h2", { text: m.title }),
          h("div", { class: "m-meta" }, m.is_adult ? h("span", { class: "tag adult", text: T("adult_badge") }) : null,
            m.content_type ? h("span", { class: "tag", text: T("type_" + m.content_type) }) : null, m.category ? h("span", { class: "tag", text: m.category.name }) : null,
            statusTag(m.status) ? h("span", { class: "tag " + (m.status === "completed" ? "ok" : "warn"), text: statusTag(m.status) }) : null))),
      h("div", { class: "stats reveal" }, cnt, statVal(statusTag(m.status) || "—", T("stat_status")), statVal(timeAgo(lastDate) || "—", T("stat_update"))),
      h("div", { class: "m-actions" }, cta, favBtn),
      readCount ? h("div", { style: "margin-top:12px" }, h("div", { class: "progress" }, h("i", { style: `width:${Math.max(5, Math.round((readCount / chapters.length) * 100))}%` })),
        h("small", { class: "muted", text: T("read_progress", { a: readCount, b: chapters.length }) })) : null,
      h("section", { class: "section" }, descEl, more),
      h("section", { class: "section" }, tabs, h("div", { style: "margin-top:14px" }, chapPanel, comPanel)),
    ];
    S.render(S.page({ title: m.title, back: true, body }), { tab: null });
    FX.countUp(cnt.firstChild, chapters.length, 800);
    FX.reveal();
  }

  async function loadComments(manga, box, ctx) {
    const S = sh();
    const list = h("div");
    const area = h("textarea", { placeholder: T("comment_placeholder"), maxlength: "1000", rows: "2" });
    const send = h("button", { class: "btn btn-primary btn-sm", type: "button" }, icon("send"), T("post"));
    const addRow = (c) => {
      const me = S.state.user, mine = c.author && me && c.author.id === me.id;
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
    const empt = () => h("p", { class: "muted", style: "padding:14px 0;text-align:center", text: T("no_comments_yet") });
    (data.items || []).forEach((c) => list.append(addRow(c)));
    if (!list.children.length) list.append(empt());
    send.addEventListener("click", async () => {
      const content = area.value.trim();
      if (!content) return;
      send.setAttribute("disabled", "");
      try {
        const r = await Api.post("/comments", { manga_id: manga.id, content }, { retries: 0 });
        if (list.firstChild && list.firstChild.tagName === "P") list.replaceChildren();
        list.prepend(addRow(r.comment)); area.value = ""; haptic("success"); toast(T("comment_sent"));
      } catch (_) { haptic("error"); toast(T("comment_error")); }
      send.removeAttribute("disabled");
    });
    box.replaceChildren(h("div", { style: "display:grid;gap:10px" }, area, h("div", { style: "text-align:right" }, send)), list);
  }

  /* ================================================================== LIBRARY */
  async function library(ctx) {
    const S = sh();
    let tab = ctx.params[0] || "favorites";
    const body = h("div");
    const render = () => {
      if (tab === "favorites") {
        const f = Store.favList();
        body.replaceChildren(f.length ? h("div", { class: "grid" }, f.map((m, i) => mangaCard(m, { delay: i % 6 }))) : empty("heart", T("fav_empty_title"), T("fav_empty_body")));
      } else {
        const hl = Store.histList();
        body.replaceChildren(hl.length ? h("div", { class: "list" }, hl.map((e) => {
          const item = h("div", { class: "item reveal" },
            h("a", { href: `#/read/${e.chapter_id}`, style: "display:flex;gap:13px;align-items:center;flex:1;min-width:0" },
              h("div", { class: "thumb" }, cover(e.manga)),
              h("div", { class: "body" }, h("b", { text: e.manga.title }), h("span", { text: `${T("chapter_n", { n: num(e.number) })} · ${timeAgo(e.updated_at)}` }),
                h("div", { class: "progress" }, h("i", { style: `width:${e.total ? Math.max(5, Math.round((e.page / e.total) * 100)) : 5}%` })))),
            h("button", { class: "icon-btn", type: "button", "aria-label": T("delete"), onclick: async () => {
              item.style.maxHeight = item.offsetHeight + "px"; requestAnimationFrame(() => item.classList.add("leaving")); haptic("light");
              try { await Store.removeHistory(e.manga.id); setTimeout(render, 420); } catch (_) { item.classList.remove("leaving"); toast(T("sync_error")); }
            } }, icon("trash")));
          return item;
        })) : empty("clock", T("hist_empty_title"), T("hist_empty_body")));
      }
      FX.reveal(body);
    };
    const seg = segmented([["favorites", `${T("favorites")} (${Store.favList().length})`], ["history", `${T("history")} (${Store.histList().length})`]], tab, (t) => { tab = t; history.replaceState(null, "", "#/library/" + t); render(); });
    render();
    S.render(S.page({ title: T("nav_library"), body: [seg, h("div", { style: "margin-top:18px" }, body)] }), { tab: "library" });
  }

  /* ================================================================== NOTIFICATIONS */
  async function notifications(ctx) {
    const S = sh();
    S.render(S.page({ title: T("notif_title"), back: true, body: skel(4, 72) }), { tab: null });
    const r = await Api.get("/notifications/me", { per_page: 50 });
    if (!ctx.ok()) return;
    const items = r.items || [];
    const markAll = items.some((n) => !n.is_read)
      ? h("button", { class: "icon-btn", type: "button", "aria-label": T("mark_all_read"), onclick: async () => { haptic("success"); await Api.patch("/notifications/me/read-all").catch(() => {}); S.state.unread = 0; notifications(ctx); } }, icon("check")) : null;
    S.render(S.page({ title: T("notif_title"), back: true, right: markAll, body: items.length
      ? h("div", { class: "list stagger" }, stagger(items.map((n) => h("div", { class: "item" + (n.is_read ? "" : " unread") },
        h("span", { class: "avatar", style: "width:42px;height:42px" }, icon("bell")),
        h("div", { class: "body", style: "white-space:normal" }, h("b", { text: n.title, style: "white-space:normal" }),
          h("span", { text: n.message, style: "display:block;margin-top:2px;color:var(--text);opacity:.85" }), h("span", { text: timeAgo(n.created_at) }))))))
      : empty("bell", T("notif_empty_title"), T("notif_empty_body")) }), { tab: null });
  }

  /* ================================================================== SETTINGS */
  let versionTaps = 0, versionTimer;
  async function openAdmin() {
    // The server decides who is the administrator (is_admin). Anyone else: nothing visible happens.
    try {
      const r = await Api.me();
      if (r.user && r.user.is_admin) { haptic("success"); FX.confetti(); toast(T("admin_mode")); setTimeout(() => { location.href = "admin/index.html"; }, 700); }
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
    const S = sh(), u = S.state.user || {};
    const showName = u.username && !/^tg_\d+$/.test(u.username) ? "@" + u.username : "";
    const rerender = () => settings({ ...ctx, silent: true });

    const mk = (label) => { const b = h("b", { text: "0" }); return [h("div", {}, b, h("span", { text: label })), b]; };
    const [d1, b1] = mk(T("stats_favs")), [d2, b2] = mk(T("stats_read")), [d3, b3] = mk(T("stats_started"));
    Store.refreshSummary().then((s) => { if (!ctx.ok()) return; FX.countUp(b1, s.favorites, 900); FX.countUp(b2, s.chapters_read, 1100); FX.countUp(b3, s.mangas_started, 1000); });

    const langSeg = segmented([["auto", T("lang_auto")], ["fr", T("lang_fr")], ["en", T("lang_en")]], I18n.pref(), (id) => { I18n.set(id); rerender(); });
    const modeSeg = segmented([["vertical", T("mode_vertical")], ["paged", T("mode_paged")]], Store.prefs().reader_mode || "vertical", (id) => Store.savePrefs({ reader_mode: id }));
    const tile = (id, colors, label) => {
      const on = Theme.pref() === id;
      const t = h("button", { class: "tile" + (on ? " on" : ""), type: "button", onclick: (ev) => { haptic("medium"); Theme.set(id, ev, rerender); } },
        h("div", { class: "sw" }, colors.map((c) => { const i = h("i"); i.style.background = c; return i; })), label, h("span", { class: "tick" }, icon("check")));
      return t;
    };
    const cell = (ic, label, val, onClick) => h(onClick ? "button" : "div", { class: "cell", type: onClick ? "button" : null, onclick: onClick },
      icon(ic), h("span", { class: "grow", text: label }), val ? h("span", { class: "val", text: val }) : null, onClick ? icon("chevron") : null);
    const danger = (label, ic, fn) => cell(ic, label, "", async () => {
      if (!(await askConfirm(T("confirm_clear")))) return;
      try { await fn(); haptic("success"); toast(T("cleared")); } catch (_) { haptic("error"); toast(T("sync_error")); }
    });

    const body = [
      h("div", { class: "card" }, h("div", { class: "profile" }, avatar(u), h("div", {}, h("b", { text: u.name || "—" }), h("span", { class: "muted", text: showName ? `${showName} · ${T("member")}` : T("member") }))),
        h("div", { class: "pstats" }, d1, d2, d3)),
      h("div", { class: "group" }, h("h3", { text: T("language") }), h("div", { class: "card", style: "padding:14px" }, langSeg)),
      h("div", { class: "group" }, h("h3", { text: T("theme") }), h("div", { class: "card themes" }, tile("auto", ["#0b0b14", "#f4f5fb", "#7c5cff"], T("theme_auto")),
        ...Theme.THEMES.map((th) => tile(th.id, th.colors, T("theme_" + th.id))))),
      h("div", { class: "group" }, h("h3", { text: T("reader_mode") }), h("div", { class: "card", style: "padding:14px" }, modeSeg)),
      h("div", { class: "group" }, h("h3", { text: T("adult_settings") }), h("div", { class: "card" },
        cell("flame", T("sc_name"), adultOk() ? T("adult_badge") : "", () => S.go("#/sainte-culture")),
        adultOk() && !u.is_admin ? cell("lock", T("adult_lock"), "", async () => {
          try { const r = await Api.del("/auth/adult-confirm"); S.state.user = r.user; haptic("success"); toast(T("adult_lock_done")); rerender(); }
          catch (_) { haptic("error"); toast(T("sync_error")); }
        }) : null)),
      h("div", { class: "group" }, h("h3", { text: T("library") }), h("div", { class: "card" },
        danger(T("clear_history"), "trash", () => Store.clearHistory()), danger(T("clear_favorites"), "heart", () => Store.clearFavorites()))),
      h("div", { class: "group" }, h("h3", { text: T("community") }), h("div", { class: "card" }, cell("send", T("nexa_channel"), cfg.channel, () => openLink(cfg.channelUrl)))),
      h("div", { class: "group" }, h("h3", { text: T("about") }), h("div", { class: "card" },
        h("div", { class: "about" }, h("img", { src: "assets/logo-original-192.png", alt: "Manga Gallery" }), h("b", { text: "Manga Gallery FR" }), h("p", { class: "muted", text: `${T("made_by")} · ${cfg.channel}` })),
        h("div", { class: "cell press", role: "button", tabindex: "0", onclick: onVersionTap }, icon("info"), h("span", { class: "grow", text: T("version") }), h("span", { class: "val", text: cfg.version })))),
    ];
    S.render(S.page({ title: T("settings_title"), body }), { tab: "settings", silent: ctx.silent });
  }

  Nexa.views = { home, browse, sainteCulture, adultGate, mangaPage, library, notifications, settings };
})();
