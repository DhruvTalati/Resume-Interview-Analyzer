import { createContext, useState, useCallback, useMemo } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // loading starts true — stays true until getMe() resolves on mount
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // last auth error message

  // Convenience: clears the current error
  const clearError = useCallback(() => setError(null), []);

  // Derived: is there a confirmed logged-in user?
  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const value = {
    user,
    setUser,
    loading,
    setLoading,
    error,
    setError,
    clearError,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
