/* Nexa Manga - micro-interactions: ripple, 3D tilt, particle bursts, confetti, counters, scroll reveal, pull-to-refresh. */
(function () {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- ripple (event delegation, works on every tappable element)
  const RIPPLE = ".btn, .chip, .cell, .icon-btn, .item, .seg button, .tile, .qtile, .chap";
  document.addEventListener("pointerdown", (e) => {
    if (reduce) return;
    const t = e.target.closest && e.target.closest(RIPPLE);
    if (!t) return;
    const r = t.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.width = s.style.height = size + "px";
    s.style.left = e.clientX - r.left - size / 2 + "px";
    s.style.top = e.clientY - r.top - size / 2 + "px";
    t.append(s);
    s.addEventListener("animationend", () => s.remove());
  }, { passive: true });

  // ---- 3D tilt with moving highlight (mouse / pen; touch gets the press-scale instead)
  function tilt(el) {
    if (reduce) return;
    el.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      el.style.setProperty("--ry", (x - .5) * 18 + "deg");
      el.style.setProperty("--rx", (.5 - y) * 18 + "deg");
      el.style.setProperty("--mx", x * 100 + "%");
      el.style.setProperty("--my", y * 100 + "%");
      el.classList.add("tilting");
    });
    el.addEventListener("pointerleave", () => {
      el.classList.remove("tilting");
      el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg");
    });
  }

  // ---- particles
  function particle(css) {
    const p = document.createElement("div");
    p.className = "fx-p";
    Object.assign(p.style, css);
    document.body.append(p);
    return p;
  }
  function burst(x, y, opts = {}) {
    if (reduce) return;
    const colors = opts.colors || ["#ff5d8f", "#ff8fb1", "#ffd166", "#7c5cff", "#22d3ee"];
    const n = opts.count || 16;
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * .5, d = 40 + Math.random() * 70, size = 6 + Math.random() * 7;
      const heart = opts.heart && i % 2 === 0;
      const p = particle({ width: size + "px", height: size + "px", background: heart ? "transparent" : colors[i % colors.length], borderRadius: i % 3 ? "50%" : "2px", color: colors[i % colors.length], fontSize: size * 2 + "px", lineHeight: 1 });
      if (heart) p.textContent = "♥";
      const dx = Math.cos(a) * d, dy = Math.sin(a) * d - 20;
      p.animate([{ transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y + dy}px) scale(${heart ? 1.3 : .3}) rotate(${Math.random() * 360}deg)`, opacity: 0 }],
        { duration: 650 + Math.random() * 350, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }).onfinish = () => p.remove();
    }
  }
  function confetti() {
    if (reduce) return;
    const colors = ["#7c5cff", "#22d3ee", "#ff5d8f", "#ffd166", "#34d399", "#ff9d5c"];
    for (let i = 0; i < 70; i++) {
      const x = Math.random() * innerWidth, w = 6 + Math.random() * 6;
      const p = particle({ width: w + "px", height: w * 1.6 + "px", background: colors[i % colors.length], borderRadius: "2px" });
      const drift = (Math.random() - .5) * 220;
      p.animate([{ transform: `translate(${x}px, -20px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + drift}px, ${innerHeight + 40}px) rotate(${360 + Math.random() * 540}deg)`, opacity: .9 }],
        { duration: 1600 + Math.random() * 1400, delay: Math.random() * 400, easing: "cubic-bezier(.3,.6,.4,1)", fill: "forwards" }).onfinish = () => p.remove();
    }
  }

  // ---- animated counter
  function countUp(el, to, ms = 900) {
    to = Number(to) || 0;
    if (reduce || to === 0) { el.textContent = String(to); return; }
    const t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms), eased = 1 - Math.pow(1 - k, 3);
      el.textContent = String(Math.round(to * eased));
      if (k < 1 && el.isConnected) requestAnimationFrame(step); else el.textContent = String(to);
    };
    requestAnimationFrame(step);
  }

  // ---- reveal on scroll
  let io;
  function reveal(root) {
    const els = (root || document).querySelectorAll(".reveal:not(.in)");
    if (!("IntersectionObserver" in window) || reduce) { els.forEach((e) => e.classList.add("in")); return; }
    io = io || new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    els.forEach((e) => io.observe(e));
  }

  // ---- pull to refresh (only when the page is scrolled to the top and a handler is set)
  const ptr = { handler: null, el: null, y0: null, dy: 0, busy: false };
  function ptrEl() {
    if (!ptr.el) { ptr.el = document.createElement("div"); ptr.el.className = "ptr"; ptr.el.innerHTML = '<svg class="i" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 6M20 4v7h-7"/></svg>'; document.body.append(ptr.el); }
    return ptr.el;
  }
  addEventListener("touchstart", (e) => { ptr.y0 = ptr.handler && !ptr.busy && window.scrollY <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null; ptr.dy = 0; }, { passive: true });
  addEventListener("touchmove", (e) => {
    if (ptr.y0 == null) return;
    const dy = e.touches[0].clientY - ptr.y0;
    if (dy <= 0) { ptr.y0 = dy < -4 ? null : ptr.y0; return; }
    ptr.dy = Math.min(dy, 220);
    const k = Math.min(1, ptr.dy / 110), el = ptrEl();
    el.style.opacity = String(k);
    el.style.transform = `translateY(${-70 + Math.min(ptr.dy * .55, 110)}px) rotate(${ptr.dy * 3}deg) scale(${.6 + k * .4})`;
  }, { passive: true });
  addEventListener("touchend", async () => {
    if (ptr.y0 == null || !ptr.el) { ptr.y0 = null; return; }
    const el = ptr.el, go = ptr.dy > 105 && ptr.handler;
    ptr.y0 = null;
    if (go) {
      ptr.busy = true; el.classList.add("spin"); el.style.transform = "translateY(40px)";
      try { await ptr.handler(); } catch (_) { /* views show their own errors */ }
      ptr.busy = false;
    }
    el.classList.remove("spin"); el.style.opacity = "0"; el.style.transform = "translateY(-70px)";
  }, { passive: true });

  window.FX = { tilt, burst, confetti, countUp, reveal, reduce, setRefresh: (fn) => { ptr.handler = fn || null; } };
})();
