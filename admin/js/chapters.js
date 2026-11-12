/* Manga Gallery FR - admin : chapitres. Les pages sont des liens https d'images (un par ligne, dans l'ordre). */
"use strict";

const chapterState = { items: [], mangas: [], page: 1, limit: 20, totalPages: 1, search: "", manga: "", status: "", editing: null };
const $ = (id) => document.getElementById(id);
const mangaLabel = (m) => m.title + (m.section === "sainte_culture" ? " · La Sainte Culture 18+" : "");
const validUrl = (u) => /^https?:\/\/[^\s<>"']+$/i.test(u);
const pageLines = () => $("chapter-pages").value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const cell = (tr, content) => { const td = document.createElement("td"); if (content instanceof Node) td.append(content); else td.textContent = content == null ? "" : String(content); tr.append(td); return td; };

async function initializeChaptersPage() {
  bindEvents();
  await loadMangas();
  const pre = new URLSearchParams(location.search).get("manga");   // lien depuis la page Mangas
  if (pre && chapterState.mangas.some((m) => String(m.id) === pre)) { chapterState.manga = pre; $("manga-filter").value = pre; }
  await loadChapters();
}

function bindEvents() {
  let timer;
  $("search-chapter").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => { chapterState.search = e.target.value.trim(); chapterState.page = 1; loadChapters(); }, 300); });
  ["manga-filter", "status-filter"].forEach((id) => $(id).addEventListener("change", () => { chapterState.manga = $("manga-filter").value; chapterState.status = $("status-filter").value; chapterState.page = 1; loadChapters(); }));
  $("refresh-chapters").addEventListener("click", async () => { await loadChapters(); showSuccess("Liste actualisée."); });
  $("add-chapter").addEventListener("click", openCreateModal);
  $("chapter-form").addEventListener("submit", saveChapter);
  $("cancel-chapter-button").addEventListener("click", closeModal);
  $("close-chapter-modal").addEventListener("click", closeModal);
  $("chapter-pages").addEventListener("input", renderPreview);
  $("previous-page").addEventListener("click", () => { if (chapterState.page > 1) { chapterState.page--; loadChapters(); } });
  $("next-page").addEventListener("click", () => { if (chapterState.page < chapterState.totalPages) { chapterState.page++; loadChapters(); } });
}

async function loadMangas() {
  try {
    let page = 1, all = [], pages = 1;
    do { const r = await api.get("/api/mangas", { page, limit: 100, section: "all" }); all = all.concat(r.items || []); pages = r.total_pages || 1; page++; } while (page <= pages && page < 20);
    chapterState.mangas = all;
    const opts = all.map((m) => { const o = document.createElement("option"); o.value = m.id; o.textContent = mangaLabel(m); return o; });
    $("manga-filter").replaceChildren(new Option("Tous les titres", ""), ...opts.map((o) => o.cloneNode(true)));
    $("chapter-manga").replaceChildren(new Option("Sélectionner un titre", ""), ...opts);
  } catch (e) { console.error(e); showError(e.message || "Impossible de charger les titres."); }
}

async function loadChapters() {
  const body = $("chapters-table-body");
  body.innerHTML = '<tr><td colspan="7" class="loading-row">Chargement...</td></tr>';
  try {
    const r = await api.get("/api/chapters", { page: chapterState.page, limit: chapterState.limit, search: chapterState.search, manga_id: chapterState.manga, status: chapterState.status, order: "desc" });
    chapterState.items = r.items || []; chapterState.totalPages = r.total_pages || 1;
    renderChapters(r.total); updatePagination();
  } catch (e) { console.error(e); body.innerHTML = '<tr><td colspan="7" class="loading-row">Erreur de chargement.</td></tr>'; showError(e.message || "Impossible de charger les chapitres."); }
}

function renderChapters(total) {
  const body = $("chapters-table-body"); body.replaceChildren();
  $("chapter-count").textContent = `${total != null ? total : chapterState.items.length} chapitre(s)`;
  if (!chapterState.items.length) { const tr = document.createElement("tr"), td = cell(tr, "Aucun chapitre."); td.colSpan = 7; td.className = "loading-row"; body.append(tr); return; }
  chapterState.items.forEach((c) => {
    const tr = document.createElement("tr");
    cell(tr, `${c.manga_title || ""} — Ch. ${c.number}`);
    cell(tr, c.title || "—");
    cell(tr, c.manga && c.manga.section === "sainte_culture" ? "La Sainte Culture" : "Galerie");
    cell(tr, c.pages_count || 0);
    cell(tr, formatDate(c.published_at || c.created_at));
    const st = document.createElement("span"); st.className = "status " + c.status; st.textContent = c.status === "published" ? "Publié" : "Brouillon"; cell(tr, st);
    const actions = document.createElement("div"); actions.className = "actions";
    [["view", "eye", "Lire dans l'application", () => { location.href = `../index.html#/read/${c.id}`; }], ["edit", "pencil", "Modifier", () => editChapter(c.id)], ["delete", "trash-2", "Supprimer", () => deleteChapter(c.id)]]
      .forEach(([cls, icon, title, fn]) => { const b = document.createElement("button"); b.type = "button"; b.className = "action-button " + cls; b.title = title; const i = document.createElement("i"); i.dataset.lucide = icon; b.append(i); b.addEventListener("click", fn); actions.append(b); });
    cell(tr, actions); body.append(tr);
  });
  if (window.lucide) window.lucide.createIcons();
}

function updatePagination() {
  const pg = document.querySelector(".pagination");
  if (chapterState.totalPages <= 1) { pg.style.display = "none"; return; }
  pg.style.display = "flex";
  $("pagination-info").textContent = `Page ${chapterState.page} sur ${chapterState.totalPages}`;
  $("previous-page").disabled = chapterState.page === 1; $("next-page").disabled = chapterState.page === chapterState.totalPages;
}

function renderPreview() {
  const lines = pageLines();
  $("pages-count").textContent = `${lines.length} page(s)`;
  const grid = $("preview-grid"); grid.replaceChildren();
  lines.slice(0, 60).forEach((u, i) => {
    const card = document.createElement("div"); card.className = "preview-item";
    if (validUrl(u)) { const img = document.createElement("img"); img.src = u; img.alt = `Page ${i + 1}`; img.loading = "lazy"; img.referrerPolicy = "no-referrer"; card.append(img); }
    const n = document.createElement("span"); n.className = "preview-number"; n.textContent = String(i + 1); card.append(n);
    grid.append(card);
  });
}

function openCreateModal() {
  chapterState.editing = null; $("chapter-form").reset(); $("chapter-id").value = "";
  $("chapter-manga").disabled = false;
  if (chapterState.manga) $("chapter-manga").value = chapterState.manga;
  const forManga = chapterState.items.filter((c) => String(c.manga_id) === String($("chapter-manga").value)).map((c) => Number(c.number));
  if (forManga.length) $("chapter-number").value = Math.floor(Math.max(...forManga)) + 1;     // numéro suivant proposé
  $("chapter-modal-title").textContent = "Ajouter un chapitre";
  renderPreview(); $("chapter-modal").classList.remove("hidden");
}
function closeModal() { $("chapter-modal").classList.add("hidden"); }

async function editChapter(id) {
  try {
    const c = await api.get(`/api/chapters/${id}`);
    chapterState.editing = id;
    $("chapter-modal-title").textContent = "Modifier le chapitre";
    $("chapter-id").value = c.id; $("chapter-manga").value = String(c.manga_id); $("chapter-manga").disabled = true;
    $("chapter-number").value = c.number; $("chapter-title").value = c.title || "";
    $("chapter-status").value = c.status === "draft" ? "draft" : "published";
    $("chapter-visibility").value = c.visibility === "public" ? "public" : "hidden";
    $("chapter-pages").value = (c.pages || []).join("\n");
    renderPreview(); $("chapter-modal").classList.remove("hidden");
  } catch (e) { console.error(e); showError(e.message || "Impossible de charger le chapitre."); }
}

async function saveChapter(event) {
  event.preventDefault();
  const pages = pageLines();
  if (pages.some((u) => !validUrl(u))) return showError("Chaque page doit être un lien http(s) valide (une par ligne).");
  const payload = { number: Number($("chapter-number").value), title: $("chapter-title").value.trim() || null,
    status: $("chapter-status").value, visibility: $("chapter-visibility").value, pages };
  const btn = $("save-chapter-button"); btn.disabled = true;
  try {
    if (chapterState.editing) { await api.put(`/api/chapters/${chapterState.editing}`, payload); showSuccess("Chapitre modifié."); }
    else {
      payload.manga_id = Number($("chapter-manga").value);
      if (!payload.manga_id) { showError("Choisis un titre."); return; }
      await api.post("/api/chapters", payload); showSuccess("Chapitre publié.");
    }
    closeModal(); await loadChapters();
  } catch (e) { console.error(e); showError(e.message || "Impossible d'enregistrer le chapitre."); }
  finally { btn.disabled = false; }
}

async function deleteChapter(id) {
  if (!confirm("Supprimer ce chapitre ?")) return;
  try { await api.delete(`/api/chapters/${id}`); showSuccess("Chapitre supprimé."); await loadChapters(); }
  catch (e) { console.error(e); showError(e.message || "Impossible de supprimer."); }
}
