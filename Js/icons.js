/* Nexa Manga - inline SVG icons (no external icon library, nothing to load). */
(function () {
  "use strict";
  const P = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    library: '<path d="M4 5a2 2 0 0 1 2-2h3v18H6a2 2 0 0 1-2-2z"/><path d="M9 3h5v18H9z"/><path d="m16 5 4 1-3.5 15-4-1z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    bell: '<path d="M6 9a6 6 0 1 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    heart: '<path d="M12 20.5S3.5 15 3.5 8.8A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.5 2.4C20.5 15 12 20.5 12 20.5z"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    send: '<path d="m21 3-9.5 18-2.2-7.8L2 11z"/><path d="m21 3-11.7 10.2"/>',
    play: '<path d="M7 4.5v15l12-7.5z"/>',
    sort: '<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>',
    trash: '<path d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    flag: '<path d="M5 21V4m0 0h11l-2 4 2 4H5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8.2v.1"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
    palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.8-1.6 0-1.3-1.2-1.5-1.2-2.7 0-1 .8-1.7 1.9-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
    shield: '<path d="M12 3 5 6v6c0 4.5 3 8 7 9 4-1 7-4.5 7-9V6z"/><path d="m9 12 2 2 4-4"/>',
    shuffle: '<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>',
    sparkles: '<path d="M11 3l1.9 5.6L18.5 10.5l-5.6 1.9L11 18l-1.9-5.6L3.5 10.5l5.6-1.9z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2-2.2-.8 2.2-.8z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    rows: '<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    refresh: '<path d="M20 11a8 8 0 1 0-2.3 6M20 4v7h-7"/>',
    sliders: '<path d="M4 6h8M18 6h2M4 12h2M12 12h8M4 18h10M20 18h0"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    columns: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M12 3v18"/>',
    scroll: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M12 7v4"/>',
    checkcircle: '<circle cx="12" cy="12" r="9"/><path d="m8 12.5 3 3 5-6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    message: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    book: '<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 21.5A2.5 2.5 0 0 0 6.5 24H20"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.4c2.3.7 3.8 2.8 3.8 5.6"/>',
  };
  function icon(name, cls) {
    const wrap = document.createElement("span");
    wrap.innerHTML = `<svg class="i ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true">${P[name] || ""}</svg>`; // static trusted markup only
    return wrap.firstChild;
  }
  window.Icons = { icon };
})();
