import axios from "axios";

// ── Instance ──────────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  timeout: 180_000, // 3 min — matches backend AI timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach timestamp for debugging ──────────────────────
api.interceptors.request.use(
  (config) => {
    config.metadata = { startTime: Date.now() };
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
api.interceptors.response.use(
  // ✅ Success — pass through
  (response) => response,

  // ❌ Error — normalize and handle globally
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || error.message || "Something went wrong.";
    const code = error.response?.data?.code;

    // Log in dev only
    if (import.meta.env.DEV) {
      const duration = Date.now() - (error.config?.metadata?.startTime || 0);
      console.error(
        `[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${status} (${duration}ms)`,
        message,
      );
    }

    // Token expired or invalid — clear session and redirect to login
    if (
      status === 401 &&
      (code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID")
    ) {
      // Only redirect if not already on an auth page
      if (
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        window.location.replace("/login");
      }
    }

    // Attach a clean message to the error so components can read it easily
    error.message = message;
    error.status = status;

    return Promise.reject(error);
  },
);

export default api;
