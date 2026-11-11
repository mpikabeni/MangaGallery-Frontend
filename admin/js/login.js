/* Nexa Admin - login page. Primary path: automatic sign-in through Telegram (opened from the mini app).
 * The password form only appears when the backend explicitly enables ADMIN_PASSWORD_LOGIN. */
"use strict";
document.addEventListener("DOMContentLoaded", async () => {
  const $ = (id) => document.getElementById(id);
  const form = $("login-form"), errorBox = $("login-error"), loader = $("login-loader"), button = $("login-button");
  const note = $("tg-note");
  const params = new URLSearchParams(location.search);
  const show = (msg) => { errorBox.textContent = msg; errorBox.classList.add("active"); };
  if (window.lucide) window.lucide.createIcons();

  const goIfAdmin = async () => {
    const u = await window.currentUser();
    if (u && u.is_admin) { location.replace("index.html"); return true; }
    window.API.clearTokens();
    return false;
  };

  if (params.get("denied")) show("Accès réservé à l'administrateur de Nexa.");

  if (window.API.initData() && !params.get("denied")) {
    loader.style.display = "flex"; form.style.display = "none";
    try { await window.loginWithTelegram(); if (await goIfAdmin()) return; show("Accès réservé à l'administrateur de Nexa."); }
    catch (e) { show(e.message || "Connexion Telegram impossible."); }
    loader.style.display = "none";
  }

  let passwordLogin = false;
  try { passwordLogin = !!(await (await fetch(window.API.config.baseUrl + "/config")).json()).password_login; } catch (_) { /* offline */ }
  if (!passwordLogin) {
    form.style.display = "none";
    if (note) note.style.display = "block";
    return;
  }
  form.style.display = "";
  $("toggle-password").addEventListener("click", () => {
    const p = $("password"); const hidden = p.type === "password"; p.type = hidden ? "text" : "password";
    $("toggle-password").querySelector("i")?.setAttribute("data-lucide", hidden ? "eye-off" : "eye");
    if (window.lucide) window.lucide.createIcons();
  });
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    errorBox.classList.remove("active"); errorBox.textContent = "";
    button.disabled = true; loader.style.display = "flex";
    try {
      await window.login($("username").value.trim(), $("password").value);
      if (!(await goIfAdmin())) show("Accès réservé à l'administrateur de Nexa.");
    } catch (e) { show(e.message || "Impossible de se connecter."); }
    finally { loader.style.display = "none"; button.disabled = false; $("password").value = ""; }
  });
});
