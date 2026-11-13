/* Manga Gallery FR - admin : search MangaDex and import a title (fiche + cover + chapters) in one click. */
"use strict";

const TYPE_LABELS = { manga: "Manga", webtoon: "Webtoon", comic: "Bande dessinée" };
const TYPES = { normal: ["manga", "webtoon", "comic"], sainte_culture: ["webtoon", "comic"] };
const STATUS = { ongoing: "En cours", completed: "Terminé", paused: "En pause" };
const state = { section: "normal", offset: 0, total: 0, busy: false };
const $ = (id) => document.getElementById(id);

async function initializeImportPage() {
  $("section-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-section]"); if (!b) return;
    state.section = b.dataset.section;
    document.querySelectorAll("#section-tabs .tab").forEach((t) => t.classList.toggle("active", t === b));
    search(true);
  });
  $("go").addEventListener("click", () => search(true));
  $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(true); });
  $("lang").addEventListener("change", () => search(true));
  $("more").addEventListener("click", () => search(false));
  await search(true);
}

async function search(reset) {
  if (state.busy) return;
  state.busy = true;
  const box = $("results"), more = $("more");
  if (reset) { state.offset = 0; box.replaceChildren(note("Recherche sur MangaDex…")); more.classList.add("hidden"); }
  try {
    const r = await api.get("/api/mangadex/search", { q: $("q").value.trim(), section: state.section, lang: $("lang").value, offset: state.offset });
    if (reset) box.replaceChildren();
    if (!r.items.length && reset) box.replaceChildren(note("Aucun résultat. Essaie un autre titre ou une autre langue."));
    r.items.forEach((it) => box.append(card(it)));
    state.offset += r.items.length; state.total = r.total || 0;
    more.classList.toggle("hidden", state.offset >= state.total || !r.items.length);
    if (window.lucide) window.lucide.createIcons();
  } catch (e) { console.error(e); if (reset) box.replaceChildren(note("Recherche impossible.")); showError(e.message || "Recherche impossible."); }
  finally { state.busy = false; }
}

function note(text) { const d = document.createElement("div"); d.className = "import-empty"; d.textContent = text; return d; }
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function card(it) {
  const c = el("article", "import-card");
  const img = el("img", "cov"); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
  if (it.cover_url) img.src = it.cover_url;
  const info = el("div");
  const title = el("h3", null, it.title);
  if (it.rating === "erotica" || it.rating === "pornographic") title.append(el("span", "badge18", "18+"));
  const meta = el("div", "meta", [it.year, STATUS[it.status], (it.genres || []).slice(0, 3).join(", ")].filter(Boolean).join(" · "));
  const desc = el("p", "desc", it.description || "Pas de description.");

  const allowed = TYPES[state.section];
  const sel = el("select");
  allowed.forEach((t) => { const o = el("option", null, TYPE_LABELS[t]); o.value = t; sel.append(o); });
  sel.value = allowed.includes(it.type_guess) ? it.type_guess : allowed[0];

  const btn = el("button", "primary-button", "Importer fiche + chapitres"); btn.type = "button";
  const row = el("div", "row"); row.append(sel, btn);
  const done = (text) => { row.replaceChildren(el("span", "meta", text), link()); };
  const link = () => { const a = el("a", "secondary-button", "Voir dans Mangas"); a.href = "mangas.html"; return a; };
  if (it.imported_id) { btn.textContent = "Déjà importé · mettre à jour"; }

  btn.addEventListener("click", async () => {
    btn.disabled = true; sel.disabled = true; btn.textContent = "Import en cours… (jusqu'à une minute)";
    try {
      const r = await api.post("/api/mangadex/import", { id: it.id, section: state.section, content_type: sel.value, lang: $("lang").value });
      const msg = r.already ? `${r.added} nouveau(x) chapitre(s)` : `Importé · ${r.added} chapitre(s)`;
      showSuccess(`${it.title} : ${msg}.`); done(msg);
    } catch (e) { console.error(e); showError(e.message || "Import impossible."); btn.disabled = false; sel.disabled = false; btn.textContent = "Réessayer"; }
  });
  info.append(title, meta, desc, row); c.append(img, info);
  return c;
}
