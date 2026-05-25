import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nt-token'));
  const [userId, setUserId] = useState(() => localStorage.getItem('nt-user-id'));
  const [email, setEmail] = useState(() => localStorage.getItem('nt-email'));

  const login = useCallback((tokenVal, userIdVal, emailVal) => {
    localStorage.setItem('nt-token', tokenVal);
    localStorage.setItem('nt-user-id', userIdVal);
    localStorage.setItem('nt-email', emailVal);
    setToken(tokenVal);
    setUserId(userIdVal);
    setEmail(emailVal);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('nt-token');
    localStorage.removeItem('nt-user-id');
    localStorage.removeItem('nt-email');
    localStorage.removeItem('nt-profile-backup');
    setToken(null);
    setUserId(null);
    setEmail(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, userId, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
