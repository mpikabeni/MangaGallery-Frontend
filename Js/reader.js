/* Manga Gallery FR - reader. Two modes: vertical scroll (webtoon) and page-by-page with swipe, tap zones and double-tap zoom.
 * The reading position is saved on the backend, so reading resumes on any device. */
(function () {
  "use strict";
  const { h, icon, T, safeImg, haptic, toast, num, throttle, segmented, sheet } = UI;
  const sh = () => Nexa.shell;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  async function reader(ctx) {
    const S = sh(), id = Number(ctx.params[0]);
    S.render([h("div", { class: "screen" }, h("div", { class: "spinner" }))], { hideNav: true });
    const r = await Api.get(`/chapters/${id}/read`);
    if (!ctx.ok()) return;
    const ch = r.chapter, manga = r.manga || { id: ch.manga_id, title: "" };
    const pages = (ch.pages || []).map(safeImg).filter(Boolean);
    const total = pages.length;
    const e = Store.entry(manga.id);
    let idx = e && e.chapter_id === ch.id && e.total && e.page < e.total ? clamp(e.page - 1, 0, Math.max(0, total - 1)) : 0;
    let mode = Store.prefs().reader_mode === "paged" ? "paged" : "vertical";
    const cleanups = [];
    S.onLeave(() => { cleanups.forEach((f) => f()); Store.flush(true); });

    const goManga = () => S.go(`#/manga/${manga.id}`);
    const navTo = (cid) => location.replace(location.pathname + location.search + `#/read/${cid}`);
    let celebrated = false;
    const celebrate = () => { if (celebrated || r.next_id) return; celebrated = true; FX.confetti(); haptic("success"); };

    function mount() {
      cleanups.splice(0).forEach((f) => f());
      document.body.style.overflow = "hidden";
      const prog = h("div", { class: "reader-progress" });
      const label = h("span", { class: "pg" });
      const scrub = h("input", { type: "range", class: "scrub", min: "1", max: String(Math.max(1, total)), value: "1", "aria-label": T("reader_page", { a: "", b: "" }) });
      const prev = h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_prev"), disabled: r.prev_id ? null : true, onclick: () => r.prev_id && navTo(r.prev_id) }, icon("back"));
      const next = h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_next"), disabled: r.next_id ? null : true, onclick: () => r.next_id && navTo(r.next_id) }, icon("chevron"));
      const gear = h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_settings"), onclick: openSettings }, icon("sliders"));
      const top = h("div", { class: "reader-bar top" },
        h("button", { class: "icon-btn", type: "button", "aria-label": T("reader_back"), onclick: goManga }, icon("back")),
        h("div", { class: "ttl" }, h("b", { text: manga.title }), h("span", { text: T("chapter_n", { n: num(ch.number) }) + (ch.title ? " — " + ch.title : "") })), gear);
      const bottom = h("div", { class: "reader-bar bottom" }, h("div", { class: "rb-row" }, prev, scrub, label, next));

      const endBox = () => h("div", { class: "reader-end" },
        h("div", { class: "big", text: r.next_id ? T("reader_end_title") : T("reader_last") }),
        r.next_id ? h("button", { class: "btn btn-primary", type: "button", onclick: () => navTo(r.next_id) }, T("reader_next"), icon("chevron")) : null,
        h("button", { class: "btn", type: "button", onclick: goManga, text: T("reader_back") }));

      let host, api;
      function onPage(i) {
        idx = clamp(i, 0, Math.max(0, total - 1));
        const pageNo = total ? idx + 1 : 0;
        label.textContent = total ? T("reader_page", { a: pageNo, b: total }) : "";
        scrub.value = String(pageNo);
        scrub.style.setProperty("--v", (total > 1 ? ((pageNo - 1) / (total - 1)) * 100 : 100) + "%");
        prog.style.width = (total > 1 ? ((pageNo - 1) / (total - 1)) * 100 : 100) + "%";
        if (total) Store.queueProgress(manga, ch, pageNo, total);
      }
      scrub.addEventListener("input", () => api.goTo(Number(scrub.value) - 1));

      const makeImg = (url, holder) => {
        const img = h("img", { src: url, alt: "", decoding: "async", referrerpolicy: "no-referrer", draggable: "false" });
        img.addEventListener("load", () => { img.classList.add("loaded"); holder.classList.add("loaded"); });
        img.addEventListener("error", () => {
          img.remove();
          holder.append(h("div", { class: "retry" }, h("span", { text: T("reader_error") }),
            h("button", { class: "btn btn-sm", type: "button", text: T("retry"), onclick: (ev) => { ev.stopPropagation(); holder.querySelector(".retry")?.remove(); makeImg(url + (url.includes("?") ? "&" : "?") + "r=" + Date.now(), holder); } })));
        });
        holder.append(img);
        return img;
      };

      if (mode === "vertical") {
        host = h("div", { class: "reader immersive" });
        const holder = h("div", { class: "pages" });
        const els = pages.map((url, i) => { const box = h("div", { class: "page" }); makeImg(url, box); if (i >= 3) box.firstChild.loading = "lazy"; return box; });
        els.forEach((b) => holder.append(b));
        if (!total) holder.append(h("div", { class: "empty", style: "padding-top:140px" }, h("div", { class: "art" }, icon("book")), h("b", { text: T("reader_empty") })));
        const end = endBox();
        host.append(holder, end);
        let lastTop = 0, ticking = false;
        host.addEventListener("scroll", () => {
          if (ticking) return; ticking = true;
          requestAnimationFrame(() => {
            ticking = false;
            const top0 = host.scrollTop, max = host.scrollHeight - host.clientHeight;
            let k = 0;
            for (let i = 0; i < els.length; i++) if (els[i].offsetTop <= top0 + host.clientHeight * .4) k = i;
            const atEnd = max > 0 && top0 >= max - 12;
            onPage(atEnd ? Math.max(0, total - 1) : k);
            if (Math.abs(top0 - lastTop) > 10) { host.classList.toggle("immersive", top0 > lastTop && top0 > 80); lastTop = top0; }
            if (atEnd) celebrate();
          });
        }, { passive: true });
        host.addEventListener("click", (ev) => { if (!ev.target.closest("button, input")) host.classList.toggle("immersive"); });
        api = { goTo: (i) => host.scrollTo({ top: els[clamp(i, 0, els.length - 1)].offsetTop, behavior: "smooth" }) };
        requestAnimationFrame(() => { if (idx > 0 && els[idx]) host.scrollTop = els[idx].offsetTop; onPage(idx); setTimeout(() => host.classList.remove("immersive"), 120); });
      } else {
        host = h("div", { class: "reader paged" });
        const track = h("div", { class: "track" });
        const slides = pages.map((url) => { const s = h("div", { class: "pg-slide" }); s.dataset.src = url; return s; });
        const endSlide = h("div", { class: "pg-slide" }, endBox());
        const all = total ? [...slides, endSlide] : [endSlide];
        track.append(...all); host.append(track);
        const loaded = new Set();
        const ensure = (i) => [i - 1, i, i + 1, i + 2].forEach((j) => { const s = slides[j]; if (s && !loaded.has(j)) { loaded.add(j); makeImg(s.dataset.src, s); } });
        let zoomed = null, zoomAt = 0;
        const unzoom = () => { if (zoomed) { zoomed.classList.remove("zoom"); zoomed = null; } };
        const go = (i, instant) => {
          unzoom();
          const k = clamp(i, 0, all.length - 1);
          track.classList.remove("drag");
          track.style.transform = `translateX(${-k * 100}%)`;
          if (instant) { track.style.transition = "none"; requestAnimationFrame(() => { track.style.transition = ""; }); }
          ensure(k); onPage(Math.min(k, total - 1));
          if (k === all.length - 1 && total) celebrate();
          cur = k;
        };
        let cur = idx;
        api = { goTo: (i) => go(i) };
        // gestures
        let x0 = null, y0 = 0, t0 = 0, dx = 0, lock = null, lastTap = 0, tapTimer = null;
        host.addEventListener("pointerdown", (ev) => {
          if (ev.target.closest(".reader-bar, button, input")) return;
          x0 = ev.clientX; y0 = ev.clientY; t0 = Date.now(); dx = 0; lock = null;
        });
        host.addEventListener("pointermove", (ev) => {
          if (x0 == null || zoomed) return;
          dx = ev.clientX - x0; const dy = ev.clientY - y0;
          if (!lock && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) lock = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
          if (lock === "x") { track.classList.add("drag"); track.style.transform = `translateX(calc(${-cur * 100}% + ${dx}px))`; }
        });
        const end = (ev) => {
          if (x0 == null) return;
          const moved = lock === "x", v = dx / Math.max(1, Date.now() - t0), w = host.clientWidth;
          const xr = (ev.clientX ?? x0) / w;
          x0 = null;
          if (zoomed) { if (!moved) { /* panning handled by native scroll */ } return; }
          if (moved) { if (dx < -60 || v < -.5) { haptic("light"); go(cur + 1); } else if (dx > 60 || v > .5) { haptic("light"); go(cur - 1); } else go(cur); return; }
          if (lock === "y") return;
          const now = Date.now();
          if (now - lastTap < 300 && slides[cur]) {            // double tap: zoom
            clearTimeout(tapTimer); lastTap = 0; haptic("medium"); zoomAt = Date.now();
            zoomed = slides[cur]; zoomed.classList.add("zoom");
            const rect = zoomed.getBoundingClientRect();
            requestAnimationFrame(() => { zoomed.scrollLeft = zoomed.scrollWidth * (xr) - w / 2; zoomed.scrollTop = zoomed.scrollHeight * ((ev.clientY - rect.top) / rect.height) - rect.height / 2; });
            return;
          }
          lastTap = now;
          tapTimer = setTimeout(() => {
            if (zoomed) return;
            if (xr < .28) go(cur - 1); else if (xr > .72) go(cur + 1); else host.classList.toggle("immersive");
          }, 260);
        };
        host.addEventListener("pointerup", end);
        host.addEventListener("pointercancel", () => { x0 = null; go(cur); });
        host.addEventListener("click", (ev) => { if (zoomed && !ev.target.closest("button") && Date.now() - zoomAt > 450) unzoom(); });   // a later tap leaves the zoom
        const onKey = (ev) => { if (ev.key === "ArrowRight") go(cur + 1); else if (ev.key === "ArrowLeft") go(cur - 1); };
        window.addEventListener("keydown", onKey); cleanups.push(() => window.removeEventListener("keydown", onKey));
        requestAnimationFrame(() => { go(idx, true); setTimeout(() => host.classList.add("immersive"), 2600); });
        try { if (!localStorage.getItem("nexa:hint-paged")) { localStorage.setItem("nexa:hint-paged", "1"); host.append(h("div", { class: "hint-swipe", text: T("swipe_hint") })); } } catch (_) {}
      }
      S.render([prog, top, host, bottom], { hideNav: true });
    }

    function openSettings() {
      const seg = segmented([["vertical", T("mode_vertical")], ["paged", T("mode_paged")]], mode, (m) => {
        mode = m; Store.savePrefs({ reader_mode: m }); haptic("medium");
        setTimeout(() => { sh_close(); mount(); }, 160);
      });
      const box = h("div", { style: "display:grid;gap:14px" }, h("div", { class: "muted", text: T("reader_mode") }), seg,
        h("p", { class: "muted", style: "font-size:13px", text: `${T("swipe_hint")} · ${T("zoom_hint")}` }));
      const s = sheet(T("reader_settings"), box);
      const sh_close = s.close;
    }
    mount();
  }
  Nexa.reader = reader;
})();
