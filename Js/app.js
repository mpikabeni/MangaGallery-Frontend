/* Manga Gallery FR - shell: boot, channel gate, hash router, persistent floating nav, pull-to-refresh. */
(function () {
  "use strict";
  const { h, icon, T, tg, haptic, toast, openLink, empty } = UI;
  const cfg = window.NEXA_CONFIG;
  const $root = document.getElementById("app");
  const state = { user: null, unread: 0 };
  let cleanups = [];
  const onLeave = (fn) => cleanups.push(fn);

  /* ------------------------------------------------------------------ persistent nav with sliding indicator */
  const TABS = [["home", "#/", "home", "nav_home"], ["browse", "#/browse", "search", "nav_browse"], ["library", "#/library", "library", "nav_library"], ["settings", "#/settings", "settings", "nav_settings"]];
  const ind = h("span", { class: "nav-ind" });
  const navItems = TABS.map(([id, href, ic, label]) => { const s = h("span"); return { id, label, s, a: h("a", { href, "aria-label": T(label) }, icon(ic), s) }; });
  const nav = h("nav", { class: "nav off" }, ind, ...navItems.map((n) => n.a));
  document.body.append(nav);
  const Nav = {
    show(tab) {
      nav.classList.remove("off");
      navItems.forEach((n) => { n.s.textContent = T(n.label); n.a.setAttribute("aria-label", T(n.label)); n.a.classList.toggle("active", n.id === tab); });
      const k = TABS.findIndex((t) => t[0] === tab);
      ind.style.opacity = k < 0 ? "0" : "1";
      if (k >= 0) ind.style.transform = `translateX(${k * 100}%)`;
    },
    hide() { nav.classList.add("off"); },
  };
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) haptic("select"); });

  /* ------------------------------------------------------------------ shell helpers used by the views */
  function page({ title, back, right, body, brand }) {
    const bell = () => h("a", { class: "icon-btn" + (state.unread > 0 ? " ring" : ""), href: "#/notifications", "aria-label": T("notif_title") }, icon("bell"), state.unread > 0 ? h("span", { class: "dot" }) : null);
    const top = h("header", { class: "topbar" },
      back ? h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_back"), onclick: goBack }, icon("back")) : null,
      brand ? h("div", { class: "brand" }, h("img", { src: "assets/logo-original-192.png", alt: "" }), h("div", {}, h("b", { text: "Manga Gallery FR" }), h("small", { text: T("made_by") })))
            : h("h1", { text: title }),
      right === "bell" ? bell() : right || null);
    return [top, h("main", {}, body)];
  }
  function render(nodes, opts = {}) {
    $root.replaceChildren(...[].concat(nodes));
    const main = $root.querySelector("main");
    if (main) main.classList.add("view");
    if (opts.hideNav) Nav.hide(); else Nav.show(opts.tab || null);
    FX.setRefresh(opts.refresh);
    FX.reveal($root);
    onScroll();
  }
  const onScroll = () => { const bar = $root.querySelector(".topbar"); if (bar) bar.classList.toggle("scrolled", window.scrollY > 4); };
  window.addEventListener("scroll", onScroll, { passive: true });
  const go = (hash) => { location.hash = hash; };
  function goBack() { if (history.length > 1) history.back(); else go("#/"); }
  Nexa.shell = { state, page, render, go, goBack, onLeave, navigate: () => navigate() };

  /* ------------------------------------------------------------------ screens: gate / errors */
  function screen(opts) {
    Nav.hide(); FX.setRefresh(null);
    $root.replaceChildren(h("div", { class: "screen" },
      h("img", { class: "logo", src: "assets/logo-original.png", alt: "Manga Gallery" }),
      opts.spinner ? h("div", { class: "spinner" }) : null,
      opts.title ? h("h1", { text: opts.title }) : null,
      opts.body ? h("p", { text: opts.body }) : null,
      opts.buttons ? h("div", { class: "btns" }, opts.buttons.map((b) => h("button", { class: "btn " + (b.cls || ""), type: "button", onclick: b.onClick }, b.icon ? icon(b.icon) : null, b.label))) : null));
  }
  function showGate(info) {
    const channel = (info && info.channel) || cfg.channel, url = (info && info.channel_url) || cfg.channelUrl;
    screen({
      title: T("gate_title"), body: T("gate_body", { channel }),
      buttons: [
        { label: T("join_channel", { channel }), cls: "btn-primary", icon: "send", onClick: () => { haptic("light"); openLink(url); } },
        { label: T("i_joined"), icon: "check", onClick: async (ev) => {
            const btn = ev.currentTarget; btn.setAttribute("disabled", "");
            try { await authenticate(); haptic("success"); await afterAuth(); }
            catch (e) { btn.removeAttribute("disabled"); if (e.code === "NOT_MEMBER") { haptic("error"); toast(T("not_joined_yet")); } else authError(e); }
          } },
      ],
    });
  }
  function authError(e) {
    endSplash();
    const retry = { label: T("retry"), cls: "btn-primary", icon: "refresh", onClick: boot };
    switch (e && e.code) {
      case "NOT_MEMBER": return showGate(e.data);
      case "MAINTENANCE": return screen({ title: T("maint_title"), body: T("maint_body"), buttons: [retry] });
      case "REGISTRATION_CLOSED": return screen({ title: T("closed_title"), body: T("closed_body") });
      case "ACCOUNT_DISABLED": return screen({ title: T("disabled_title"), body: T("disabled_body") });
      case "INVALID_INIT_DATA": return screen({ title: T("tg_only_title"), body: T("tg_only_body") });
      case "CHANNEL_CHECK_FAILED": return screen({ title: T("check_title"), body: T("check_body"), buttons: [retry] });
      case "RATE_LIMITED": return screen({ title: T("rate_title"), body: T("rate_body"), buttons: [retry] });
      case "NETWORK": return screen({ title: T("net_title"), body: T("net_body"), buttons: [retry] });
      default: return screen({ title: T("error_title"), body: T("error_body"), buttons: [retry] });
    }
  }
  async function authenticate() { const d = await Api.login(); state.user = d.user; return d; }

  /* ------------------------------------------------------------------ router */
  let navToken = 0;
  function parseHash() {
    const raw = location.hash.replace(/^#/, "") || "/";
    const [path, qs] = raw.split("?");
    return { path, q: new URLSearchParams(qs || "") };
  }
  const ROOTS = new Set(["/", "/browse", "/sainte-culture", "/library", "/library/favorites", "/library/history", "/settings"]);
  const routes = [
    [/^\/?$/, (c) => Nexa.views.home(c)], [/^\/browse$/, (c) => Nexa.views.browse(c)], [/^\/sainte-culture$/, (c) => Nexa.views.sainteCulture(c)], [/^\/manga\/(\d+)$/, (c) => Nexa.views.mangaPage(c)],
    [/^\/read\/(\d+)$/, (c) => Nexa.reader(c)], [/^\/library(?:\/(favorites|history))?$/, (c) => Nexa.views.library(c)],
    [/^\/notifications$/, (c) => Nexa.views.notifications(c)], [/^\/settings$/, (c) => Nexa.views.settings(c)],
  ];
  const AUTH_CODES = ["NOT_MEMBER", "MAINTENANCE", "ACCOUNT_DISABLED", "INVALID_INIT_DATA", "REGISTRATION_CLOSED"];

  async function navigate() {
    const my = ++navToken;
    cleanups.splice(0).forEach((f) => { try { f(); } catch (_) {} });
    document.body.style.overflow = "";
    const { path, q } = parseHash();
    if (tg && tg.BackButton) { if (ROOTS.has(path)) tg.BackButton.hide(); else tg.BackButton.show(); }
    window.scrollTo(0, 0);
    for (const [rx, view] of routes) {
      const m = path.match(rx);
      if (!m) continue;
      const ctx = { params: m.slice(1), q, path, ok: () => my === navToken };
      try { await view(ctx); }
      catch (e) {
        if (!ctx.ok()) return;
        if (AUTH_CODES.includes(e.code)) return authError(e);
        if (e.code === "ADULT_REQUIRED") return Nexa.views.adultGate();
        const notFound = e.status === 404;
        render(page({ title: T("sorry"), back: !ROOTS.has(path), body: empty("info", notFound ? T("not_found") : T("error_title"), notFound ? "" : T("error_body"),
          h("div", null,
            h("button", { class: "btn btn-primary", type: "button", onclick: navigate }, icon("refresh"), T("retry")),
            notFound ? null : h("small", { class: "credit", style: "text-align:center;margin-top:14px", text: "Code " + (e.status || e.code || "?") + " · " + String(e.message || "").slice(0, 120) }))) }),
        { tab: ROOTS.has(path) ? (path.split("/")[1] || "home") : null });
      }
      return;
    }
    location.replace("#/");
  }
  function onBack() {
    const btn = document.querySelector(".reader-bar.top .icon-btn");
    if (btn) return btn.click();
    goBack();
  }

  /* ------------------------------------------------------------------ splash + wake-up banner */
  const splash = document.getElementById("splash");
  const t0 = Date.now();
  function endSplash() {
    if (!splash || splash.classList.contains("out")) return;
    setTimeout(() => { splash.classList.add("out"); setTimeout(() => splash.remove(), 700); }, Math.max(0, 1700 - (Date.now() - t0)));
  }
  let wakeEl;
  document.addEventListener("nexa:wake", (e) => {
    const hint = document.getElementById("splash-hint");
    if (e.detail) {
      if (hint) hint.textContent = `${T("wake_msg")}\n${T("wake_slow")}`;
      if (!wakeEl) { wakeEl = h("div", { class: "wake glass", role: "status" }, h("span", { class: "spinner" }), h("span", { text: T("wake_msg") })); document.body.append(wakeEl); }
      requestAnimationFrame(() => wakeEl && wakeEl.classList.add("show"));
    } else {
      if (hint) hint.textContent = "";
      if (wakeEl) { wakeEl.classList.remove("show"); const el = wakeEl; wakeEl = null; setTimeout(() => el.remove(), 600); }
    }
  });

  /* ------------------------------------------------------------------ landing (opened outside Telegram) */
  async function landing() {
    Nav.hide(); FX.setRefresh(null);
    let bot = (cfg.botUsername || "").replace(/^@/, "");
    const box = h("div", { class: "btns" });
    const paint = () => {
      box.replaceChildren(
        bot ? h("button", { class: "btn btn-primary", type: "button", onclick: () => openLink(`https://t.me/${bot}`) }, icon("send"), T("open_in_telegram")) : null,
        h("button", { class: "btn" + (bot ? "" : " btn-primary"), type: "button", onclick: () => openLink(cfg.channelUrl) }, icon("send"), T("join_channel", { channel: cfg.channel })),
        null);
    };
    $root.replaceChildren(h("div", { class: "screen" },
      h("img", { class: "logo", src: "assets/logo-original.png", alt: "Manga Gallery" }),
      h("span", { class: "landing-tag", text: T("landing_tag") }),
      h("h1", { class: "grad", text: T("landing_title") }),
      h("p", { text: T("landing_body") }), box));
    paint();
    if (!bot) {   // the backend knows the bot username: fetch it (public endpoint, no login needed)
      try { const c = await Promise.race([Api.config(), new Promise((_, rej) => setTimeout(rej, 7000))]); bot = (c && c.bot_username) || ""; if (bot) paint(); } catch (_) { /* optional */ }
    }
  }

  /* ------------------------------------------------------------------ boot */
  async function afterAuth() {
    try { await Store.load(state.user); } catch (_) { /* the app still works from the cache */ }
    I18n.onChange = (p) => Store.savePrefs({ language: p });
    Theme.onChange = (p) => Store.savePrefs({ theme: p });
    const sp = tg && tg.initDataUnsafe && tg.initDataUnsafe.start_param;           // deep link: ?startapp=m12
    const m = sp && /^m(\d{1,9})$/.exec(sp);
    if (m && !location.hash) location.hash = `#/manga/${m[1]}`;
    if (tg && tg.BackButton) { tg.BackButton.offClick && tg.BackButton.offClick(onBack); tg.BackButton.onClick(onBack); }
    window.removeEventListener("hashchange", navigate);
    window.addEventListener("hashchange", navigate);
    await navigate();
    endSplash();
  }
  async function boot() {
    if (tg) { try { tg.ready(); tg.expand(); tg.disableVerticalSwipes && tg.disableVerticalSwipes(); } catch (_) {} }
    Theme.apply(); I18n.apply();
    if (!Api.initData()) { endSplash(); return landing(); }
    try { await authenticate(); } catch (e) { return authError(e); }
    await afterAuth();
  }
  if (tg && tg.onEvent) tg.onEvent("themeChanged", () => Theme.apply());
  boot();
})();
