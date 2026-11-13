/* Manga Gallery FR - admin : publier des titres dans la Galerie ou dans La Sainte Culture (18+).
 * Le serveur est la référence : il refuse « manga » dans La Sainte Culture (webtoon et bande dessinée uniquement). */
"use strict";

const TYPE_LABELS = { manga: "Manga", webtoon: "Webtoon", comic: "Bande dessinée" };
const TYPES_BY_SECTION = { normal: ["manga", "webtoon", "comic"], sainte_culture: ["webtoon", "comic"] };
const STATUS_LABELS = { ongoing: "En cours", completed: "Terminé", paused: "En pause", hiatus: "Hiatus", cancelled: "Arrêté" };

const mangaState = { items: [], categories: [], section: "normal", page: 1, limit: 20, totalPages: 1, search: "", category: "", status: "", type: "", editing: null };
const $ = (id) => document.getElementById(id);
const fillSelect = (sel, options, current) => {
  sel.replaceChildren(...options.map(([value, label]) => { const o = document.createElement("option"); o.value = value; o.textContent = label; return o; }));
  if (current !== undefined && options.some(([v]) => v === current)) sel.value = current;
};
const cell = (tr, content) => { const td = document.createElement("td"); if (content instanceof Node) td.append(content); else td.textContent = content == null ? "" : String(content); tr.append(td); return td; };

async function initializeMangasPage() {
  bindEvents();
  paintTypeFilter();
  await loadCategories();
  await loadMangas();
}

function bindEvents() {
  $("section-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-section]"); if (!b) return;
    mangaState.section = b.dataset.section; mangaState.page = 1; mangaState.type = "";
    document.querySelectorAll("#section-tabs .tab").forEach((t) => t.classList.toggle("active", t === b));
    $("list-title").textContent = b.dataset.section === "sainte_culture" ? "La Sainte Culture · 18+" : "Galerie";
    paintTypeFilter(); loadMangas();
  });
  let timer;
  $("search-manga").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => { mangaState.search = e.target.value.trim(); mangaState.page = 1; loadMangas(); }, 300); });
  ["type-filter", "category-filter", "status-filter"].forEach((id) => $(id).addEventListener("change", () => {
    mangaState.type = $("type-filter").value; mangaState.category = $("category-filter").value; mangaState.status = $("status-filter").value;
    mangaState.page = 1; loadMangas();
  }));
  $("refresh-mangas").addEventListener("click", async () => { await loadMangas(); showSuccess("Liste actualisée."); });
  $("add-manga").addEventListener("click", openCreateModal);
  $("manga-form").addEventListener("submit", saveManga);
  $("cancel-button").addEventListener("click", closeModal);
  $("close-modal").addEventListener("click", closeModal);
  $("manga-section").addEventListener("change", () => paintFormTypes());
  $("manga-title").addEventListener("input", () => { if (!mangaState.editing) $("manga-slug").value = slugify($("manga-title").value); });
  $("manga-cover").addEventListener("input", previewCover);
  $("manga-cover-file").addEventListener("change", (e) => pickImage(e, "cover", "manga-cover", "cover-btn-label"));
  $("manga-banner-file").addEventListener("change", (e) => pickImage(e, "banner", "manga-banner", "banner-btn-label"));
  $("previous-page").addEventListener("click", () => { if (mangaState.page > 1) { mangaState.page--; loadMangas(); } });
  $("next-page").addEventListener("click", () => { if (mangaState.page < mangaState.totalPages) { mangaState.page++; loadMangas(); } });
}

const slugify = (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const validUrl = (u) => /^https?:\/\/[^\s<>"']+$/i.test(u);

function paintTypeFilter() {
  fillSelect($("type-filter"), [["", "Tous les types"], ...TYPES_BY_SECTION[mangaState.section].map((t) => [t, TYPE_LABELS[t]])], mangaState.type);
}
function paintFormTypes(current) {
  const types = TYPES_BY_SECTION[$("manga-section").value] || [];
  fillSelect($("manga-type"), types.map((t) => [t, TYPE_LABELS[t]]), current);
}

async function loadCategories() {
  try {
    const r = await api.get("/api/categories");
    mangaState.categories = r.items || [];
    const opts = mangaState.categories.map((c) => [String(c.id), c.name]);
    fillSelect($("category-filter"), [["", "Toutes les catégories"], ...opts]);
    fillSelect($("manga-category"), [["", "Aucune catégorie"], ...opts]);
  } catch (e) { console.error(e); showError("Impossible de charger les catégories."); }
}

async function loadMangas() {
  const body = $("mangas-table-body");
  body.innerHTML = '<tr><td colspan="9" class="loading-row">Chargement...</td></tr>';
  try {
    const r = await api.get("/api/mangas", { page: mangaState.page, limit: mangaState.limit, search: mangaState.search,
      category_id: mangaState.category, status: mangaState.status, type: mangaState.type, section: mangaState.section });
    mangaState.items = r.items || []; mangaState.totalPages = r.total_pages || 1;
    renderMangas(r.total);
    updatePagination();
  } catch (e) { console.error(e); body.innerHTML = '<tr><td colspan="9" class="loading-row">Erreur de chargement.</td></tr>'; showError(e.message || "Impossible de charger les titres."); }
}

function renderMangas(total) {
  const body = $("mangas-table-body");
  body.replaceChildren();
  $("manga-count").textContent = `${total != null ? total : mangaState.items.length} titre(s)`;
  if (!mangaState.items.length) {
    const tr = document.createElement("tr"), td = cell(tr, "Aucun titre pour le moment. Utilise « Publier un titre ».");
    td.colSpan = 9; td.className = "loading-row"; body.append(tr); return;
  }
  mangaState.items.forEach((m) => {
    const tr = document.createElement("tr");
    const box = document.createElement("div"); box.className = "manga-cover";
    const img = document.createElement("img"); img.alt = ""; img.src = validUrl(m.cover_url || "") ? m.cover_url : "assets/default-cover.png"; img.referrerPolicy = "no-referrer";
    img.addEventListener("error", () => { img.src = "assets/default-cover.png"; }, { once: true });
    box.append(img); cell(tr, box);
    cell(tr, m.title);
    cell(tr, TYPE_LABELS[m.content_type] || m.content_type);
    cell(tr, (m.category && m.category.name) || "—");
    const st = document.createElement("span"); st.className = "status " + m.status; st.textContent = STATUS_LABELS[m.status] || m.status; cell(tr, st);
    cell(tr, m.chapters_count || 0);
    cell(tr, m.visibility === "public" ? "Public" : "Masqué");
    cell(tr, formatDate(m.created_at));
    const actions = document.createElement("div"); actions.className = "actions";
    [...(m.source === "mangadex" ? [["view", "refresh-cw", "Chercher les nouveaux chapitres", () => syncManga(m)]] : []), ["view", "eye", "Chapitres", () => { location.href = `chapters.html?manga=${m.id}`; }], ["edit", "pencil", "Modifier", () => editManga(m.id)], ["delete", "trash-2", "Supprimer", () => deleteManga(m.id, m.title)]]
      .forEach(([cls, icon, title, fn]) => { const b = document.createElement("button"); b.type = "button"; b.className = "action-button " + cls; b.title = title; const i = document.createElement("i"); i.dataset.lucide = icon; b.append(i); b.addEventListener("click", fn); actions.append(b); });
    cell(tr, actions);
    body.append(tr);
  });
  if (window.lucide) window.lucide.createIcons();
}

function updatePagination() {
  const pg = document.querySelector(".pagination");
  if (mangaState.totalPages <= 1) { pg.style.display = "none"; return; }
  pg.style.display = "flex";
  $("pagination-info").textContent = `Page ${mangaState.page} sur ${mangaState.totalPages}`;
  $("previous-page").disabled = mangaState.page === 1; $("next-page").disabled = mangaState.page === mangaState.totalPages;
}

/* ------------------------------------------------------------------ uploads */
const unsaved = new Set();            // uploaded during this modal session but not saved yet
const discard = (urls) => { urls = [...urls]; if (urls.length) api.post("/api/uploads/discard", { urls }).catch(() => {}); };

async function pickImage(event, kind, inputId, labelId) {
  const input = event.target, file = input.files && input.files[0];
  if (!file) return;
  const label = $(labelId), original = label.textContent;
  label.textContent = "Envoi en cours…";
  try {
    const fd = new FormData(); fd.append("file", file); fd.append("kind", kind);
    const r = await api.upload("/api/uploads/image", fd, (p) => { label.textContent = `Envoi… ${Math.round(p * 100)} %`; });
    const old = $(inputId).value.trim();
    if (unsaved.has(old)) { unsaved.delete(old); discard([old]); }       // replaced before saving: free it
    $(inputId).value = r.url; unsaved.add(r.url);
    label.textContent = "Image envoyée ✓ (changer)";
    previewCover();
  } catch (e) { console.error(e); label.textContent = original; showError(e.message || "Envoi impossible."); }
  finally { input.value = ""; }
}

/* ------------------------------------------------------------------ modal */
function previewCover() { const u = $("manga-cover").value.trim(); $("cover-preview").src = validUrl(u) ? u : "assets/default-cover.png"; }
function openCreateModal() {
  mangaState.editing = null;
  $("manga-form").reset();
  $("manga-id").value = "";
  resetLabels();
  $("manga-section").value = mangaState.section;           // on publie dans l'onglet courant
  paintFormTypes(mangaState.type || undefined);
  $("modal-title").textContent = mangaState.section === "sainte_culture" ? "Publier dans La Sainte Culture (18+)" : "Publier dans la Galerie";
  previewCover();
  $("manga-modal").classList.remove("hidden");
}
function closeModal() { $("manga-modal").classList.add("hidden"); discard(unsaved); unsaved.clear(); resetLabels(); }
function resetLabels() { $("cover-btn-label").textContent = "Téléverser une image"; $("banner-btn-label").textContent = "Téléverser une image"; }

async function editManga(id) {
  try {
    const r = await api.get(`/api/mangas/${id}`);
    const m = r.manga || r;
    mangaState.editing = id;
    $("modal-title").textContent = "Modifier le titre";
    $("manga-id").value = m.id;
    $("manga-section").value = m.section || "normal";
    paintFormTypes(m.content_type);
    $("manga-title").value = m.title || "";
    $("manga-slug").value = m.slug || "";
    $("manga-category").value = m.category_id ? String(m.category_id) : "";
    $("manga-status").value = STATUS_LABELS[m.status] && ["ongoing", "completed", "paused"].includes(m.status) ? m.status : "ongoing";
    $("manga-description").value = m.description || "";
    $("manga-cover").value = m.cover_url || "";
    $("manga-banner").value = m.banner_url || "";
    $("manga-visibility").value = m.visibility === "public" ? "public" : "hidden";
    previewCover();
    $("manga-modal").classList.remove("hidden");
  } catch (e) { console.error(e); showError(e.message || "Impossible de charger le titre."); }
}

async function saveManga(event) {
  event.preventDefault();
  const cover = $("manga-cover").value.trim(), banner = $("manga-banner").value.trim();
  if ((cover && !validUrl(cover)) || (banner && !validUrl(banner))) return showError("Les images doivent être des liens http(s) valides.");
  const payload = {
    title: $("manga-title").value.trim(), description: $("manga-description").value.trim(),
    section: $("manga-section").value, content_type: $("manga-type").value,
    category_id: $("manga-category").value || null, status: $("manga-status").value, visibility: $("manga-visibility").value,
    cover_url: cover || null, banner_url: banner || null,
  };
  const slug = $("manga-slug").value.trim(); if (slug) payload.slug = slug;
  const btn = $("save-button"); btn.disabled = true;
  try {
    if (mangaState.editing) { await api.put(`/api/mangas/${mangaState.editing}`, payload); showSuccess("Titre modifié."); }
    else { await api.post("/api/mangas", payload); showSuccess(payload.section === "sainte_culture" ? "Publié dans La Sainte Culture." : "Publié dans la Galerie."); }
    unsaved.clear();                                         // saved: these images now belong to the title
    closeModal();
    mangaState.section = payload.section;                    // montre directement l'espace où l'on vient de publier
    document.querySelectorAll("#section-tabs .tab").forEach((t) => t.classList.toggle("active", t.dataset.section === payload.section));
    $("list-title").textContent = payload.section === "sainte_culture" ? "La Sainte Culture · 18+" : "Galerie";
    paintTypeFilter();
    await loadMangas();
  } catch (e) { console.error(e); showError(e.message || "Impossible d'enregistrer."); }
  finally { btn.disabled = false; }
}

async function deleteManga(id, title) {
  if (!confirm(`Supprimer « ${title} » et tous ses chapitres ?`)) return;
  try { await api.delete(`/api/mangas/${id}`); showSuccess("Titre supprimé."); await loadMangas(); }
  catch (e) { console.error(e); showError(e.message || "Impossible de supprimer."); }
}

async function syncManga(m) {
  try {
    const r = await api.post(`/api/mangadex/sync/${m.id}`, {});
    showSuccess(r.added ? `${r.added} nouveau(x) chapitre(s) ajouté(s).` : "Aucun nouveau chapitre.");
    await loadMangas();
  } catch (e) { console.error(e); showError(e.message || "Mise à jour impossible."); }
}
