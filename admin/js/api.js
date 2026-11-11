/* Nexa Admin - API client. Tokens live in sessionStorage only and are shared with the mini app. */
(function () {
  "use strict";
  const cfg = window.NEXA_CONFIG || {};
  const BASE = String(cfg.apiUrl || "https://mangagallery-backend.onrender.com/api").replace(/\/+$/, "");
  const A = "nexa_access", R = "nexa_refresh";
  const S = {
    get(k) { try { return sessionStorage.getItem(k) || ""; } catch (_) { return ""; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} },
    del(k) { try { sessionStorage.removeItem(k); } catch (_) {} },
  };
  const token = () => S.get(A);
  const setTokens = (a, r) => { if (a) S.set(A, a); if (r) S.set(R, r); };
  const clear = () => { S.del(A); S.del(R); S.del("nexa_admin_user"); };
  const initData = () => (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || "";

  // Pages call "/api/categories" or "/categories": BASE already ends with /api, so strip a leading "api/".
  const norm = (p) => String(p).trim().replace(/^\/+/, "").replace(/^api\//, "");

  async function rawFetch(path, options, tok) {
    const headers = Object.assign({ Accept: "application/json" }, options.headers || {});
    if (options.body !== undefined && !(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
    if (tok) headers.Authorization = "Bearer " + tok;
    const res = await fetch(BASE + "/" + norm(path), Object.assign({}, options, { headers }));
    let body = {};
    try { body = await res.json(); } catch (_) {}
    return { res, body };
  }

  let refreshing = null;
  function renew() {
    if (!refreshing) {
      refreshing = (async () => {
        const rt = S.get(R);
        if (rt) {
          const { res, body } = await rawFetch("/auth/refresh", { method: "POST" }, rt);
          if (res.ok && body.access_token) { S.set(A, body.access_token); return true; }
        }
        if (initData()) {
          const { res, body } = await rawFetch("/auth/telegram", { method: "POST", body: JSON.stringify({ init_data: initData() }) }, "");
          if (res.ok && body.access_token) { setTokens(body.access_token, body.refresh_token); return true; }
        }
        return false;
      })().finally(() => { refreshing = null; });
    }
    return refreshing;
  }

  async function request(path, options = {}) {
    let { res, body } = await rawFetch(path, options, token());
    if (res.status === 401 && !options._retry && (await renew())) {
      ({ res, body } = await rawFetch(path, options, token()));
    }
    if (res.status === 401) clear();
    if (!res.ok) {
      const err = new Error((body && (body.message || (body.error && body.error.message))) || `Erreur API (${res.status})`);
      err.status = res.status; err.code = body && body.code; err.response = body;
      throw err;
    }
    if (Array.isArray(body)) return { items: body, data: body, total: body.length, total_pages: 1, pages: 1 };
    if (body && body.data && typeof body.data === "object" && !Array.isArray(body.data)) return Object.assign({}, body.data, body);
    return body;
  }
  const qs = (params) => {
    const q = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== "") q.set(k, v); });
    const s = q.toString();
    return s ? "?" + s : "";
  };
  const send = (method, path, data, options = {}) =>
    request(path, Object.assign({}, options, { method, body: data === undefined ? undefined : (data instanceof FormData ? data : JSON.stringify(data)) }));

  window.API = {
    get: (p, params, o = {}) => request(p + qs(params), Object.assign({}, o, { method: "GET" })),
    post: (p, d, o) => send("POST", p, d, o), put: (p, d, o) => send("PUT", p, d, o),
    patch: (p, d, o) => send("PATCH", p, d, o), delete: (p, o) => send("DELETE", p, undefined, o),
    setTokens, clearTokens: clear, getToken: token, initData, config: { baseUrl: BASE },
    raw: rawFetch,
  };
  window.api = window.API;
})();
