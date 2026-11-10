/* Nexa Manga - API client.
 * Authentication = Telegram initData sent to the backend, which verifies its signature.
 * Tokens live in sessionStorage (cleared when the Telegram window closes) and are shared with /admin. */
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

  function initData() { return (window.Telegram && Telegram.WebApp && Telegram.WebApp.initData) || ""; }

  async function raw(method, path, { params, body, token } = {}) {
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
    let res;
    try {
      res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    } catch (_) {
      throw new ApiError("network", 0, "NETWORK");
    }
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new ApiError((data && data.message) || res.statusText, res.status, data && data.code, data);
    return data;
  }

  let loginFlight = null;
  function login() {
    if (!loginFlight) {
      loginFlight = raw("POST", "/auth/telegram", { body: { init_data: initData() } })
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
    get: (p, params) => request("GET", p, { params }),
    post: (p, body) => request("POST", p, { body: body || {} }),
    patch: (p, body) => request("PATCH", p, { body: body || {} }),
    del: (p) => request("DELETE", p),
    clear: () => { store.del(A); store.del(R); },
  };
})();
