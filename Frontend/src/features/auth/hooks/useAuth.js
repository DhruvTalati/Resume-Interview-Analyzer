import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {
  const context = useContext(AuthContext);

  // ── Guard: must be inside AuthProvider ───────────────────────────────────
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>.");
  }

  const {
    user,
    setUser,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    isAuthenticated,
  } = context;

  // Prevent getMe running more than once on mount
  const initialised = useRef(false);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async ({ email, password }) => {
    clearError();
    setLoading(true);
    try {
      const data = await login({ email, password });
      setUser(data.user);
      return data; // caller can use this to navigate
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
      throw err; // re-throw so the page component can react (e.g. show toast)
    } finally {
      setLoading(false);
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────
  const handleRegister = async ({ username, email, password }) => {
    clearError();
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      setUser(data.user);
      return data;
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  // BUG IN ORIGINAL: `logout(data)` — `data` is undefined at that point.
  // Fixed: call `logout()` with no arguments.
  const handleLogout = async () => {
    clearError();
    setLoading(true);
    try {
      await logout(); // ← was logout(data) — data was undefined
      setUser(null);
    } catch (err) {
      // Even if the server call fails, clear the user locally
      setUser(null);
      setError(err.message || "Logout failed.");
    } finally {
      setLoading(false);
    }
  };

  // ── Session restore on mount ──────────────────────────────────────────────
  // Runs once when the app loads to check if the user is already logged in
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const restoreSession = async () => {
      try {
        const data = await getMe();
        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        // getMe() only throws for non-401 errors (API down, network, etc.)
        // 401 is handled inside getMe() and returns null — so this is a real error
        console.error("[useAuth] Session restore failed:", err.message);
      } finally {
        setLoading(false); // always unblock the app
      }
    };

    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    user,
    loading,
    error,
    isAuthenticated,
    handleLogin,
    handleRegister,
    handleLogout,
    clearError,
  };
};
