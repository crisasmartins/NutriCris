import React, { createContext, useContext, useState, useEffect } from 'react';
import { neonSignIn, neonSignUp, neonGetSession, ensureNutricionistaExists } from '../lib/neon';

const AuthContext = createContext();

const STORAGE_KEY_USER = 'nutricris_user';
const STORAGE_KEY_TOKEN = 'nutricris_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN) || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    async function initAuth() {
      const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const storedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (storedToken && storedUser) {
        try {
          const localUser = JSON.parse(storedUser);

          // Immediately sync the user to the DB to prevent FK violations
          if (localUser?.id && localUser?.email) {
            await ensureNutricionistaExists(
              localUser.id,
              localUser.name || localUser.nome || localUser.email.split('@')[0],
              localUser.email
            );
          }

          const session = await neonGetSession(storedToken);
          if (session && session.user) {
            setUser(session.user);
            localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(session.user));
            // Sync session user too
            if (session.user.id && session.user.email) {
              await ensureNutricionistaExists(
                session.user.id,
                session.user.name || session.user.nome || session.user.email.split('@')[0],
                session.user.email
              );
            }
          }
        } catch (e) {
          console.error('Session validation error:', e);
        }
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  const login = async (email, password) => {
    const result = await neonSignIn({ email, password });
    if (result && result.user) {
      setUser(result.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
      if (result.token) {
        setToken(result.token);
        localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
      }
      // Ensure nutritionist exists in DB
      if (result.user.id && result.user.email) {
        await ensureNutricionistaExists(
          result.user.id,
          result.user.name || result.user.nome || result.user.email.split('@')[0],
          result.user.email
        );
      }
    }
    return result;
  };

  const signUp = async (name, email, password) => {
    const result = await neonSignUp({ name, email, password });
    if (result && result.user) {
      setUser(result.user);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(result.user));
      if (result.token) {
        setToken(result.token);
        localStorage.setItem(STORAGE_KEY_TOKEN, result.token);
      }
    }
    return result;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signUp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
