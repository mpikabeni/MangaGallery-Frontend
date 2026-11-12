/* Nexa Admin - one boot script for every page (replaces 13 divergent inline scripts that double-initialised pages). */
"use strict";
(function () {
  // Pages whose own script already initialises itself on DOMContentLoaded are not initialised twice.
  const INIT = {
    notifications: "initializeNotificationsPage", reports: "initializeReportsPage", settings: "initializeSettingsPage",
    statistics: "initializeStatisticsPage", system: "initializeSystemPage", index: "initializeDashboardPage",
    mangas: "initializeMangasPage", chapters: "initializeChaptersPage",
  };
  document.addEventListener("DOMContentLoaded", async () => {
    const page = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
    try {
      const user = await protectPage();
      window.buildSidebar(user);
      const d = document.getElementById("current-date");
      if (d) d.textContent = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const name = document.getElementById("admin-name"); if (name) name.textContent = user.name || user.username;
      const av = document.getElementById("admin-avatar"); if (av) av.src = (user.photo_url && /^https?:\/\//.test(user.photo_url)) ? user.photo_url : "assets/logo.png";
      if (window.lucide) window.lucide.createIcons();
      const fn = INIT[page] && window[INIT[page]];
      if (typeof fn === "function") await fn();
    } catch (error) {
      console.error(error);
      if (window.lucide) window.lucide.createIcons();
    }
  });
})();
