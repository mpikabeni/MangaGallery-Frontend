/* Manga Gallery FR - API client.
 * Authentication = Telegram initData sent to the backend, which verifies its signature.
 * Handles Render's cold start: timeouts, automatic retries with back-off and a "server is waking up" signal. */
(function () {
  "use strict";
  const cfg = window.NEXA_CONFIG;
  const BASE = cfg.apiUrl.replace(/\/+$/, "");
  const A = "nexa_access", R = "nexa_refresh";
  const store = {
    get: (k) => { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (_) {} },
    del: (k) => { try { sessionStorage.removeItem(k); } catch (_) {} },
  };

  class ApiError extends Error {
    constructor(message, status, code, data) { super(message); this.status = status; this.code = code; this.data = data || {}; }
  }
  const initData = () => (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || "";
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // "waking up" signal: shown when a request is slow or has to be retried
  let slow = 0;
  const wake = (on) => document.dispatchEvent(new CustomEvent("nexa:wake", { detail: on }));

  async function once(method, path, { params, body, token, keepalive, timeout = 25000 } = {}) {
    let url = BASE + "/" + path.replace(/^\/+/, "");
    if (params) {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.set(k, v); });
      const s = q.toString();
      if (s) url += "?" + s;
    }
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeout);
    let res;
    try {
      res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: ctrl.signal, keepalive: !!keepalive });
    } catch (_) {
      throw new ApiError("network", 0, "NETWORK");
    } finally { clearTimeout(timer); }
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new ApiError((data && data.message) || res.statusText, res.status, data && data.code, data);
    return data;
  }

  async function raw(method, path, opts = {}) {
    const retries = opts.retries != null ? opts.retries : (method === "POST" ? 0 : 2);
    let flagged = false;
    const t = setTimeout(() => { flagged = true; slow++; wake(true); }, 3500);
    try {
      for (let i = 0; ; i++) {
        try { return await once(method, path, opts); }
        catch (e) {
          const transient = e.code === "NETWORK" || [502, 503, 504].includes(e.status);
          if (!transient || i >= retries) throw e;
          if (!flagged) { flagged = true; slow++; wake(true); }
          await sleep(1200 * (i + 1));
        }
      }
    } finally { clearTimeout(t); if (flagged && --slow <= 0) { slow = 0; wake(false); } }
  }

  let loginFlight = null;
  function login() {
    if (!loginFlight) {
      loginFlight = raw("POST", "/auth/telegram", { body: { init_data: initData() }, retries: 3, timeout: 35000 })
        .then((d) => { store.set(A, d.access_token); store.set(R, d.refresh_token); return d; })
        .finally(() => { loginFlight = null; });
    }
    return loginFlight;
  }

  let refreshFlight = null;
  function refresh() {
    const rt = store.get(R);
    if (!rt) return login();
    if (!refreshFlight) {
      refreshFlight = raw("POST", "/auth/refresh", { token: rt })
        .then((d) => { store.set(A, d.access_token); return d; })
        .catch((e) => (e.code === "NOT_MEMBER" ? Promise.reject(e) : login()))
        .finally(() => { refreshFlight = null; });
    }
    return refreshFlight;
  }

  async function request(method, path, opts = {}) {
    if (!store.get(A)) await login();
    try {
      return await raw(method, path, { ...opts, token: store.get(A) });
    } catch (e) {
      if (e.status === 401) {
        await refresh();
        return raw(method, path, { ...opts, token: store.get(A) });
      }
      throw e;
    }
  }

  window.Api = {
    ApiError, initData, login,
    config: () => raw("GET", "/config"),
    me: () => request("GET", "/auth/me"),
    get: (p, params, o) => request("GET", p, { ...o, params }),
    post: (p, body, o) => request("POST", p, { ...o, body: body || {} }),
    put: (p, body, o) => request("PUT", p, { ...o, body: body || {} }),
    patch: (p, body, o) => request("PATCH", p, { ...o, body: body || {} }),
    del: (p, o) => request("DELETE", p, o),
    clear: () => { store.del(A); store.del(R); },
  };
})();
