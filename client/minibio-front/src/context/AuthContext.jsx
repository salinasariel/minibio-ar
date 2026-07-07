"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [impersonating, setImpersonating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('jwt_token');
    const storedUser = localStorage.getItem('user_data');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setImpersonating(Boolean(localStorage.getItem('admin_backup')));
    setLoading(false);
  }, []);

  const saveSession = (data) => {
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('jwt_token', data.token);
    localStorage.setItem('user_data', JSON.stringify(data.user));
  };

  const login = async (email, password) => {
    const data = await apiFetch('/auth/login', null, {
      method: 'POST',
      body: { email, password },
    });
    saveSession(data);
    router.push('/dashboard');
    return true;
  };

  // Registro con auto-login: la API devuelve token + user en el registro
  const register = async ({ email, password, username, display_name }) => {
    const data = await apiFetch('/auth/register', null, {
      method: 'POST',
      body: { email, password, username, display_name },
    });
    saveSession(data);
    router.push('/dashboard');
    return true;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('admin_backup');
    setImpersonating(false);
    router.push('/login');
  };

  // Modo demo: respaldar la sesión del admin y entrar como el usuario
  const startImpersonation = (data) => {
    localStorage.setItem(
      'admin_backup',
      JSON.stringify({ token: localStorage.getItem('jwt_token'), user: localStorage.getItem('user_data') })
    );
    saveSession(data);
    setImpersonating(true);
    router.push('/dashboard');
  };

  // Volver a la cuenta de admin
  const stopImpersonation = () => {
    const backup = localStorage.getItem('admin_backup');
    if (backup) {
      const { token: t, user: u } = JSON.parse(backup);
      localStorage.setItem('jwt_token', t);
      localStorage.setItem('user_data', u);
      setToken(t);
      setUser(JSON.parse(u));
    }
    localStorage.removeItem('admin_backup');
    setImpersonating(false);
    router.push('/admin');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    impersonating,
    startImpersonation,
    stopImpersonation,
  };

  return (
    <AuthContext.Provider value={value}>
      {impersonating && user && (
        <div className="fixed bottom-0 inset-x-0 z-[100] bg-amber-400 text-amber-950 px-4 py-2.5 flex items-center justify-center gap-3 text-sm font-medium shadow-lg">
          <span>
            Modo demo: estás viendo la cuenta de <strong>@{user.username}</strong>
          </span>
          <button
            onClick={stopImpersonation}
            className="px-3 py-1 bg-amber-950 text-amber-50 rounded-lg font-semibold hover:bg-amber-900 transition-colors"
          >
            Volver a mi cuenta
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
