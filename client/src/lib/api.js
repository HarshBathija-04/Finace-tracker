const BASE = (import.meta.env.VITE_API_URL || "http://localhost:5122").replace(/\/$/, "");
const TOKEN_KEY = "finsight.token";
const SLOW_AFTER_MS = 3500;

class ApiError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const storage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (v) => {
    try {
      if (v) localStorage.setItem(TOKEN_KEY, v);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* private mode: session lasts until reload */
    }
  },
};

let token = storage.get();
export const getToken = () => token;
export const setToken = (t) => {
  token = t;
  storage.set(t);
};

// Render's free tier sleeps; a slow first request means it is waking up, so the UI can say so.
let slowCount = 0;
const slowListeners = new Set();
const emitSlow = (delta) => {
  slowCount += delta;
  slowListeners.forEach((fn) => fn(slowCount > 0));
};
export const onSlowChange = (fn) => {
  slowListeners.add(fn);
  return () => slowListeners.delete(fn);
};

export async function api(path, { method = "GET", body, form, signal } = {}) {
  let slow = false;
  const timer = setTimeout(() => {
    slow = true;
    emitSlow(1);
  }, SLOW_AFTER_MS);
  try {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(90_000)]) : AbortSignal.timeout(90_000),
      });
    } catch (err) {
      if (err.name === "AbortError" && signal?.aborted) throw err;
      throw new ApiError(0, "Can't reach the server. Check your connection and try again.", "NETWORK");
    }
    if (res.status === 204) return null;
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      if (res.status === 401 && token) window.dispatchEvent(new Event("finsight:unauthorized"));
      const e = data?.error;
      throw new ApiError(res.status, e?.message || "Something went wrong", e?.code, e?.details);
    }
    return data;
  } finally {
    clearTimeout(timer);
    if (slow) emitSlow(-1);
  }
}
