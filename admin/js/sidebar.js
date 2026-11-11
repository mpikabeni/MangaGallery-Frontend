/* Nexa Admin - shared sidebar (the original pages shipped an empty <aside>). Built with DOM calls, no HTML strings. */
"use strict";
(function () {
  const MENU = [
    ["index.html", "layout-dashboard", "Tableau de bord"], ["mangas.html", "book-open", "Mangas"], ["chapters.html", "layers", "Chapitres"],
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
    const version = (window.NEXA_CONFIG && window.NEXA_CONFIG.version) || "V2.05";
    const logout = el("button", { type: "button", id: "logout-button", class: "icon-button", title: "Déconnexion" }, icon("log-out"));
    logout.addEventListener("click", () => window.secureLogout());
    aside.replaceChildren(
      el("div", { class: "sidebar-logo" }, el("a", { href: "index.html", class: "logo-link" },
        el("img", { src: "assets/logo.png", alt: "Nexa", class: "logo-image" }),
        el("div", { class: "logo-text" }, el("h2", { text: "Nexa Manga" }), el("p", { text: "ADMIN " + version })))),
      el("nav", { class: "sidebar-menu", id: "sidebar-menu" }, ...MENU.map(([href, ic, label]) =>
        el("a", { href, class: "menu-item" + (here === href ? " active" : ""), "data-page": href.replace(".html", "") }, icon(ic), el("span", { text: label })))),
      el("div", { class: "sidebar-footer" },
        el("div", { class: "admin-mini-profile" },
          el("div", { class: "admin-info" }, el("h4", { id: "sidebarName", text: (user && (user.name || user.username)) || "Admin" }), el("p", { id: "sidebarRole", text: "Administrateur" })),
          logout),
        el("a", { href: "../index.html#/settings", class: "menu-item", style: "margin-top:8px" }, icon("arrow-left"), el("span", { text: "Retour à l'application" }))));
  };
})();
