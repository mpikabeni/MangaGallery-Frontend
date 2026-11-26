/* Nexa Admin - shared sidebar (the original pages shipped an empty <aside>). Built with DOM calls, no HTML strings. */
"use strict";
(function () {
  const MENU = [
    ["index.html", "layout-dashboard", "Tableau de bord"], ["mangas.html", "book-open", "Mangas"], ["chapters.html", "layers", "Chapitres"], ["import.html", "download-cloud", "Importer"],
    ["categories.html", "tags", "Catégories"], ["users.html", "users", "Utilisateurs"], ["comments.html", "message-square", "Commentaires"],
    ["notifications.html", "bell", "Notifications"], ["reports.html", "flag", "Signalements"], ["media.html", "image", "Médias"],
    ["roles.html", "shield", "Rôles"], ["statistics.html", "chart-column", "Statistiques"], ["system.html", "database-backup", "Système"],
    ["settings.html", "settings", "Paramètres"],
  ];
  const el = (tag, attrs, ...kids) => {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => (k === "text" ? (e.textContent = v) : e.setAttribute(k, v)));
    kids.forEach((k) => k && e.append(k));
    return e;
  };
  const icon = (n) => el("i", { "data-lucide": n });

  window.buildSidebar = function (user) {
    const aside = document.querySelector("aside.sidebar");
    if (!aside) return;
    const here = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    const version = (window.NEXA_CONFIG && window.NEXA_CONFIG.version) || "Finale";
    const logout = el("button", { type: "button", id: "logout-button", class: "icon-button", title: "Déconnexion" }, icon("log-out"));
    logout.addEventListener("click", () => window.secureLogout());
    aside.replaceChildren(
      el("div", { class: "sidebar-logo" }, el("a", { href: "index.html", class: "logo-link" },
        el("img", { src: "assets/logo.png", alt: "Nexa", class: "logo-image" }),
        el("div", { class: "logo-text" }, el("h2", { text: "Manga Gallery FR" }), el("p", { text: "ADMIN " + version })))),
      el("nav", { class: "sidebar-menu", id: "sidebar-menu" }, ...MENU.map(([href, ic, label]) =>
        el("a", { href, class: "menu-item" + (here === href ? " active" : ""), "data-page": href.replace(".html", "") }, icon(ic), el("span", { text: label })))),
      el("div", { class: "sidebar-footer" },
        el("div", { class: "admin-mini-profile" },
          el("div", { class: "admin-info" }, el("h4", { id: "sidebarName", text: (user && (user.name || user.username)) || "Admin" }), el("p", { id: "sidebarRole", text: "Administrateur" })),
          logout),
        el("a", { href: "../index.html#/", class: "menu-item back-to-app", style: "margin-top:8px" }, icon("arrow-left"), el("span", { text: "Retour à l'application" })),
        window.buildThemePicker ? window.buildThemePicker() : null,
        el("div", { class: "storage-meter", id: "storage-meter" })));
    buildMobileBar(version);
    loadStorage();
  };

  /* ---- storage meter: database size vs capacity, alert from 80 %, cleanup of unused images ---- */
  const mb = (b) => (b / 1048576 >= 1000 ? (b / 1073741824).toFixed(2).replace(".", ",") + " Go" : Math.round(b / 1048576) + " Mo");
  async function loadStorage(force) {
    const box = document.getElementById("storage-meter");
    if (!box || !window.api) return;
    let u = null;
    try {
      const cached = JSON.parse(sessionStorage.getItem("mgfr_storage") || "null");
      if (!force && cached && Date.now() - cached.t < 60000) u = cached.u;
    } catch (_) {}
    if (!u) {
      try { u = await window.api.get("/api/uploads/usage"); sessionStorage.setItem("mgfr_storage", JSON.stringify({ t: Date.now(), u })); }
      catch (_) { box.hidden = true; return; }
    }
    renderStorage(box, u);
  }
  function renderStorage(box, u) {
    box.hidden = false;
    box.className = "storage-meter " + u.level;
    const cleanBtn = el("button", { type: "button", class: "sm-clean", text: "Nettoyer les images inutilisées" });
    cleanBtn.addEventListener("click", async () => {
      if (!confirm("Supprimer les images téléversées qui ne servent à aucun titre ni chapitre (envois annulés, anciennes couvertures) ?")) return;
      cleanBtn.disabled = true;
      try {
        const r = await window.api.post("/api/uploads/cleanup", {});
        window.showSuccess && window.showSuccess(r.deleted ? `${r.deleted} image(s) supprimée(s) · ${mb(r.freed_bytes)} libérés.` : "Rien à nettoyer : toutes les images sont utilisées.");
        sessionStorage.removeItem("mgfr_storage"); loadStorage(true);
      } catch (err) { window.showError && window.showError(err.message || "Nettoyage impossible."); cleanBtn.disabled = false; }
    });
    const left = u.chapters_left != null ? ` · ≈ ${u.chapters_left} chapitres téléversables` : "";
    box.replaceChildren(
      el("div", { class: "sm-head" }, el("span", { text: "Stockage" }), el("b", { text: `${u.percent.toFixed(0)} %` })),
      el("div", { class: "sm-bar" }, el("i", { style: `width:${Math.min(100, u.percent)}%` })),
      el("small", { text: `${mb(u.used_bytes)} / ${mb(u.capacity_bytes)}${left}` }),
      cleanBtn);
    document.querySelector(".storage-alert")?.remove();
    if (u.level !== "ok") {
      const main = document.querySelector("main.main-content");
      if (main) main.prepend(el("div", { class: "storage-alert " + u.level, role: "alert" },
        el("b", { text: u.level === "critical" ? "⛔ Stockage presque plein" : "⚠ Stockage à " + u.percent.toFixed(0) + " %" }),
        el("span", { text: u.level === "critical"
          ? " : les envois seront refusés à 97 %. Nettoie les images inutilisées, supprime d'anciens chapitres ou passe à une base plus grande."
          : " : privilégie l'import MangaDex (il ne stocke pas les pages) et nettoie régulièrement les images inutilisées." })));
    }
  }

  /* Phones / tablets: a fixed top bar (Menu + back to the app) and the sidebar becomes a drawer, so EVERY button stays reachable. */
  function buildMobileBar(version) {
    if (document.querySelector(".mobile-bar")) return;
    const menuBtn = el("button", { type: "button", class: "mb-btn", id: "mobile-menu-btn", "aria-label": "Ouvrir le menu", "aria-expanded": "false", "aria-controls": "sidebar-menu" },
      icon("menu"), el("span", { text: "Menu" }));
    const back = el("a", { href: "../index.html#/", class: "mb-btn mb-back", "aria-label": "Retour à l'application" }, icon("arrow-left"), el("span", { text: "Application" }));
    const bar = el("header", { class: "mobile-bar" }, menuBtn, el("strong", { class: "mb-title", text: "Admin · " + version }), back);
    const backdrop = el("div", { class: "nav-backdrop" });
    document.body.prepend(backdrop);
    document.body.prepend(bar);
    const set = (open) => { document.body.classList.toggle("nav-open", open); menuBtn.setAttribute("aria-expanded", String(open)); };
    menuBtn.addEventListener("click", () => set(!document.body.classList.contains("nav-open")));
    backdrop.addEventListener("click", () => set(false));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
    document.querySelector("aside.sidebar").addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 900) set(false); });
    if (window.lucide) window.lucide.createIcons();
  }
})();
