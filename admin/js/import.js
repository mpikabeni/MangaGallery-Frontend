/* Manga Gallery FR - admin : search MangaDex, SEE how many chapters exist (in the chosen language) before publishing, import in one click. */
"use strict";

const TYPE_LABELS = { manga: "Manga", webtoon: "Webtoon", comic: "Bande dessinée" };
const TYPES = { normal: ["manga", "webtoon", "comic"], sainte_culture: ["webtoon", "comic"] };
const STATUS = { ongoing: "En cours", completed: "Terminé", paused: "En pause" };
const SYN = { vf: "synopsis VF", auto: "synopsis traduit automatiquement", en: "synopsis en anglais", none: "sans synopsis" };
const state = { section: "normal", offset: 0, total: 0, busy: false, token: 0, queue: [], running: false };
const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const num = (n) => (Number.isInteger(n) ? String(n) : String(n));

async function initializeImportPage() {
  $("section-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-section]"); if (!b) return;
    state.section = b.dataset.section;
    document.querySelectorAll("#section-tabs .tab").forEach((t) => t.classList.toggle("active", t === b));
    search(true);
  });
  $("go").addEventListener("click", () => search(true));
  $("q").addEventListener("keydown", (e) => { if (e.key === "Enter") search(true); });
  ["lang", "only-completed", "coming-mode"].forEach((id) => $(id).addEventListener("change", () => search(true)));
  $("check-coming").addEventListener("click", async (e) => {
    const b = e.currentTarget; b.disabled = true;
    try {
      const r = await api.post("/api/mangadex/check-coming", {});
      showSuccess(r.count ? `${r.count} titre(s) sorti(s) : ${r.released.join(", ")}` : "Aucun titre « Bientôt » n'est encore complet.");
    } catch (err) { showError(err.message || "Vérification impossible."); } finally { b.disabled = false; }
  });
  $("only-complete").addEventListener("change", applyFilters);
  $("more").addEventListener("click", () => search(false));
  await search(true);
}

async function search(reset) {
  if (state.busy) return;
  state.busy = true;
  const box = $("results"), more = $("more");
  if (reset) { state.token++; state.queue = []; state.offset = 0; box.replaceChildren(note("Recherche sur MangaDex…")); more.classList.add("hidden"); }
  try {
    const r = await api.get("/api/mangadex/search", { q: $("q").value.trim(), section: state.section, lang: $("lang").value,
      offset: state.offset, completed: $("only-completed").checked ? 1 : 0, coming: $("coming-mode").checked ? 1 : 0 });
    if (reset) box.replaceChildren();
    if (!r.items.length && reset) box.replaceChildren(note("Aucun résultat. Essaie un autre titre, une autre langue, ou décoche « terminées »."));
    r.items.forEach((it) => box.append(card(it)));
    state.offset += r.items.length; state.total = r.total || 0;
    more.classList.toggle("hidden", state.offset >= state.total || !r.items.length);
    if (window.lucide) window.lucide.createIcons();
    pump();
  } catch (e) { console.error(e); if (reset) box.replaceChildren(note("Recherche impossible.")); showError(e.message || "Recherche impossible."); }
  finally { state.busy = false; }
}

function note(text) { const d = el("div", "import-empty", text); return d; }

/* ---- chapter counts: one light MangaDex request per title, one at a time (their limit is ~5 requests / second) */
function pump() {
  if (state.running) return;
  state.running = true;
  (async () => {
    while (state.queue.length) {
      const job = state.queue.shift();
      if (job.token !== state.token) continue;
      await job.run();
      await new Promise((r) => setTimeout(r, 350));
    }
    state.running = false;
  })();
}

function applyFilters() {
  const needComplete = $("only-complete").checked && !$("coming-mode").checked;
  let hidden = 0;
  document.querySelectorAll(".import-card").forEach((c) => {
    const info = c._info;
    // normal mode: only complete titles with chapters.  "Bientôt" mode: only titles that are NOT complete yet (complete ones are imported normally)
    const hide = !!info && (c._coming ? info.complete : (info.count === 0 || (needComplete && !info.complete)));
    c.classList.toggle("hidden", hide);
    if (hide) hidden++;
  });
  const n = $("hidden-note");
  n.textContent = !hidden ? "" : $("coming-mode").checked
    ? `${hidden} titre(s) masqué(s) : déjà complets en français, importe-les en mode normal.`
    : `${hidden} titre(s) masqué(s) : sans chapitre dans cette langue${needComplete ? " ou incomplets" : ""}. ${needComplete ? "Décoche « tous les chapitres » pour les voir." : ""}`;
  n.classList.toggle("hidden", !hidden);
}

function card(it) {
  const c = el("article", "import-card");
  const comingMode = $("coming-mode").checked;
  c._coming = comingMode;
  const img = el("img", "cov"); img.alt = ""; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
  if (it.cover_url) img.src = it.cover_url;
  const info = el("div");
  const title = el("h3", null, it.title);
  if (it.rating === "erotica" || it.rating === "pornographic") title.append(el("span", "badge18", "18+"));
  const meta = el("div", "meta", [it.year, (it.genres || []).slice(0, 3).join(", ")].filter(Boolean).join(" · "));
  const chips = el("div", "chips");
  chips.append(el("span", "chip" + (it.status === "completed" ? " ok" : ""), STATUS[it.status] || it.status));
  const lang = $("lang").value;
  chips.append(el("span", "chip" + (it.has_lang_description ? " ok" : " warn"),
    it.has_lang_description ? "Synopsis VF ✓" : lang === "fr" && it.description_en ? "Synopsis : traduit auto à l'import" : "Pas de synopsis dans cette langue"));
  const desc = el("p", "desc", it.description || "Pas de description.");
  const count = el("div", "count loading", "Comptage des chapitres…");

  const allowed = TYPES[state.section];
  const sel = el("select");
  allowed.forEach((t) => { const o = el("option", null, TYPE_LABELS[t]); o.value = t; sel.append(o); });
  sel.value = allowed.includes(it.type_guess) ? it.type_guess : allowed[0];
  const btn = el("button", "primary-button", comingMode ? "Ajouter à « Bientôt »" : "Importer fiche + chapitres"); btn.type = "button"; btn.disabled = true;
  const row = el("div", "row"); row.append(sel, btn);
  const link = () => { const a = el("a", "secondary-button", "Voir dans Mangas"); a.href = "mangas.html"; return a; };
  if (it.imported_id) btn.textContent = comingMode ? "Déjà ajouté" : "Déjà importé · mettre à jour";

  const token = state.token;
  state.queue.push({ token, run: async () => {
    try {
      const i = await api.get("/api/mangadex/info", { id: it.id, lang, status: it.status, declared: it.declared_last || "" });
      c._info = i;
      count.classList.remove("loading");
      if (!i.count) {
        count.textContent = comingMode ? "0 chapitre en français pour l'instant · idéal pour « Bientôt »" : "0 chapitre dans cette langue : titre ignoré.";
        count.classList.add(comingMode ? "warn" : "bad"); btn.disabled = !comingMode;
      } else {
        const missing = i.missing_count ? ` · ⚠ ${i.missing_count} manquant(s) (${i.missing.join(", ")}${i.missing_count > i.missing.length ? "…" : ""})` : "";
        count.textContent = `Chapitres ${num(i.first)} → ${num(i.last)} · ${i.count} chapitre(s)` + (i.complete ? " · ✓ complet" : missing);
        chips.append(el("span", "chip " + (i.complete ? "ok" : "warn"), i.complete ? "Complet" : "Incomplet"));
        btn.disabled = false;
      }
    } catch (e) { count.classList.remove("loading"); count.textContent = "Comptage impossible : " + (e.message || "erreur"); btn.disabled = false; }
    applyFilters();
  } });

  btn.addEventListener("click", async () => {
    btn.disabled = true; sel.disabled = true; btn.textContent = "Import en cours… (jusqu'à une minute)";
    try {
      const r = await api.post("/api/mangadex/import", { id: it.id, section: state.section, content_type: sel.value, lang, notify: $("notify").checked, mode: comingMode ? "coming" : "normal" });
      const msg = r.coming ? "Ajouté à « Bientôt » : il sortira automatiquement quand il sera complet en français" : r.already ? `${r.added} nouveau(x) chapitre(s)`
        : `Importé · chapitres ${num(r.first)} → ${num(r.last)} (${r.count}) · ${SYN[r.synopsis] || ""}${r.notified ? " · utilisateurs prévenus" : ""}`;
      showSuccess(`${it.title} : ${msg}.`);
      row.replaceChildren(el("span", "meta", msg), link());
    } catch (e) { console.error(e); showError(e.message || "Import impossible."); btn.disabled = false; sel.disabled = false; btn.textContent = "Réessayer"; }
  });
  info.append(title, meta, chips, desc, count, row); c.append(img, info);
  return c;
}
