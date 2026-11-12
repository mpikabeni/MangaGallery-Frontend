/* Manga Gallery FR - shared UI helpers. Everything is built with DOM calls / textContent (never innerHTML with data). */
(function () {
  "use strict";
  const cfg = window.NEXA_CONFIG;
  const tg = window.Telegram && Telegram.WebApp;
  const T = (k, v) => I18n.t(k, v);
  const API_ORIGIN = new URL(cfg.apiUrl).origin;

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
      else if (kind === "select") hf.selectionChanged();
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
    toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
  }
  const askConfirm = (msg) => new Promise((res) => (tg && tg.showConfirm ? tg.showConfirm(msg, res) : res(window.confirm(msg))));
  function openLink(url) {
    if (tg && /^https:\/\/t\.me\//i.test(url) && tg.openTelegramLink) tg.openTelegramLink(url);
    else if (tg && tg.openLink) tg.openLink(url);
    else window.open(url, "_blank", "noopener");
  }
  function timeAgo(iso) {
    if (!iso) return "";
    const d = new Date(iso + (/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? "" : "Z"));
    if (isNaN(d)) return "";
    const s = Math.round((d - Date.now()) / 1000), abs = Math.abs(s);
    const rtf = new Intl.RelativeTimeFormat(I18n.lang(), { numeric: "auto" });
    if (abs < 45) return T("just_now");
    if (abs < 3600) return rtf.format(Math.round(s / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(s / 3600), "hour");
    if (abs < 2592000) return rtf.format(Math.round(s / 86400), "day");
    return rtf.format(Math.round(s / 2592000), "month");
  }
  const isRecent = (iso, days = 3) => { const d = new Date(iso + (/[zZ]|[+-]\d\d:?\d\d$/.test(iso || "") ? "" : "Z")); return !isNaN(d) && Date.now() - d < days * 864e5; };
  const num = (n) => String(Number(n));
  const initials = (s) => (String(s || "?").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("") || "?").toUpperCase();
  const gradient = (seed) => { const a = (Number(seed) * 47) % 360; return `linear-gradient(135deg, hsl(${a} 70% 45%), hsl(${(a + 55) % 360} 75% 38%))`; };
  const statusTag = (s) => ({ ongoing: "status_ongoing", completed: "status_completed", paused: "status_paused", hiatus: "status_hiatus", cancelled: "status_cancelled" }[s] ? T({ ongoing: "status_ongoing", completed: "status_completed", paused: "status_paused", hiatus: "status_hiatus", cancelled: "status_cancelled" }[s]) : "");
  const throttle = (fn, ms) => { let last = 0, t; return (...a) => { const now = Date.now(); clearTimeout(t); if (now - last >= ms) { last = now; fn(...a); } else t = setTimeout(() => { last = Date.now(); fn(...a); }, ms - (now - last)); }; };

  /** Image that fades in, falls back to a coloured placeholder if it cannot load. */
  function lazyImg(url, cls, extra) {
    const img = h("img", { src: url, alt: "", loading: "lazy", decoding: "async", referrerpolicy: "no-referrer", ...(extra || {}) });
    if (cls) img.className = cls;
    img.addEventListener("load", () => img.classList.add("loaded"));
    requestAnimationFrame(() => { if (img.complete && img.naturalWidth) img.classList.add("loaded"); });
    return img;
  }
  function cover(m, badge) {
    const url = safeImg(m && m.cover_url);
    const box = h("div", { class: "cover" });
    const ph = h("div", { class: "ph", text: initials(m && m.title) });
    ph.style.background = gradient((m && m.id) || 1);
    box.append(ph);
    if (url) {
      const img = lazyImg(url);
      img.addEventListener("error", () => img.remove());
      box.append(img);
    }
    box.append(h("span", { class: "shine" }));
    if (badge) box.append(h("span", { class: "badge", text: badge }));
    return box;
  }
  function mangaCard(m, opts = {}) {
    const sub = opts.sub !== undefined ? opts.sub : (m.chapters_count ? `${m.chapters_count} ${T("chapters").toLowerCase()}` : "");
    const a = h("a", { class: "mcard reveal", href: `#/manga/${m.id}` },
      h("div", { class: "tilt" }, cover(m, opts.badge || (m.section === "sainte_culture" ? T("adult_badge") : null))),
      h("div", { class: "t", text: m.title }),
      sub ? h("div", { class: "s", text: sub }) : null,
      opts.progress != null ? h("div", { class: "progress" }, h("i", { style: `width:${Math.max(4, Math.min(100, opts.progress))}%` })) : null);
    if (opts.delay != null) a.style.setProperty("--d", opts.delay);
    FX.tilt(a);
    return a;
  }
  function avatar(user) {
    const url = safeImg(user && user.photo_url);
    const a = h("span", { class: "avatar" });
    a.textContent = initials(user && user.name);
    if (url) {
      const img = h("img", { src: url, alt: "", referrerpolicy: "no-referrer" });
      img.addEventListener("load", () => { a.textContent = ""; a.append(img); });
    }
    return a;
  }
  const empty = (ic, title, body, action) => h("div", { class: "empty" }, h("div", { class: "art" }, icon(ic)), h("b", { text: title }), body ? h("p", { text: body }) : null, action || null);
  const skel = (n, hgt) => Array.from({ length: n }, () => { const s = h("div", { class: "skel" }); s.style.height = hgt + "px"; return s; });

  /** Bottom sheet with spring animation. Returns { close }. */
  function sheet(title, content) {
    const bg = h("div", { class: "sheet-bg" });
    const el = h("div", { class: "sheet", role: "dialog" }, h("div", { class: "grab" }), title ? h("h3", { text: title }) : null, content);
    document.body.append(bg, el);
    requestAnimationFrame(() => { bg.classList.add("show"); el.classList.add("show"); });
    const close = () => { bg.classList.remove("show"); el.classList.remove("show"); setTimeout(() => { bg.remove(); el.remove(); }, 450); };
    bg.addEventListener("click", close);
    let y0 = null;
    el.addEventListener("touchstart", (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchmove", (e) => { if (y0 != null && e.touches[0].clientY - y0 > 0) el.style.transform = `translate(-50%, ${e.touches[0].clientY - y0}px)`; }, { passive: true });
    el.addEventListener("touchend", (e) => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; el.style.transform = ""; if (dy > 90) close(); }, { passive: true });
    return { close, el };
  }

  /** Segmented control with a sliding thumb. */
  function segmented(options, current, onPick) {
    const wrap = h("div", { class: "seg" });
    wrap.style.setProperty("--n", options.length);
    const thumb = h("span", { class: "thumb" });
    const btns = options.map(([id, label]) => h("button", { type: "button", text: label, onclick: () => { haptic("select"); set(id); onPick(id); } }));
    function set(id) {
      const k = Math.max(0, options.findIndex(([x]) => x === id));
      wrap.style.setProperty("--k", k);
      btns.forEach((b, i) => b.classList.toggle("on", i === k));
    }
    wrap.append(thumb, ...btns);
    set(current);
    wrap.setValue = set;
    return wrap;
  }

  window.UI = { h, icon, T, tg, safeImg, haptic, toast, askConfirm, openLink, timeAgo, isRecent, num, initials, gradient, statusTag,
    throttle, lazyImg, cover, mangaCard, avatar, empty, skel, sheet, segmented };
})();
