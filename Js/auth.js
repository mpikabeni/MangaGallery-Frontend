/* Nexa Admin - authentication. The admin signs in through Telegram (same session as the mini app).
 * Access is decided by the server (user.is_admin); the checks below only drive navigation. */
"use strict";
const NEXA_VERSION = (window.NEXA_CONFIG && window.NEXA_CONFIG.version) || "Finale";

function isAuthenticated() { return !!window.API.getToken(); }

async function loginWithTelegram() {
  const { res, body } = await window.API.raw("/auth/telegram", { method: "POST", body: JSON.stringify({ init_data: window.API.initData() }) }, "");
  if (!res.ok || !body.success) { const e = new Error(body.message || "Connexion Telegram impossible"); e.code = body.code; throw e; }
  window.API.setTokens(body.access_token, body.refresh_token);
  return body.user;
}
async function login(username, password) {
  const { res, body } = await window.API.raw("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }, "");
  if (!res.ok || !body.success) { const e = new Error(body.message || "Identifiants incorrects"); e.code = body.code; throw e; }
  window.API.setTokens(body.access_token, body.refresh_token);
  return true;
}
async function currentUser() {
  const r = await window.API.get("/auth/me");
  return r.user || null;
}
const loadCurrentUser = currentUser;
async function verifySession() { try { return !!(await currentUser()); } catch (_) { return false; } }

function toLogin(reason) { window.location.replace("login.html" + (reason ? "?" + reason : "")); }

async function protectPage() {
  try {
    if (!isAuthenticated()) {
      if (window.API.initData()) await loginWithTelegram(); else { toLogin(); throw new Error("Authentification requise"); }
    }
    const user = await currentUser();
    if (!user || !user.is_admin) { window.API.clearTokens(); toLogin("denied=1"); throw new Error("Accès administrateur requis"); }
    sessionStorage.setItem("nexa_admin_user", JSON.stringify({ username: user.username, name: user.name }));
    return user;
  } catch (e) {
    if (e.status === 401 || e.status === 403) { window.API.clearTokens(); toLogin(); }
    throw e;
  }
}
async function secureLogout() {
  try { await window.API.post("/auth/logout", {}); } catch (_) { /* ignore */ }
  window.API.clearTokens();
  window.location.href = window.API.initData() ? "../index.html#/settings" : "login.html";
}
function clearTokens() { window.API.clearTokens(); }
Object.assign(window, { isAuthenticated, login, loginWithTelegram, verifySession, protectPage, secureLogout, clearTokens, currentUser, loadCurrentUser });
