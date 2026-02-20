"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token no proporcionado');
        setChecking(false);
        return;
      }

      try {
        const data = await apiFetch(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, null, { method: 'GET' });
        setValidToken(true);
      } catch (err) {
        setError(err.message || 'Token inválido o expirado');
        setValidToken(false);
      } finally {
        setChecking(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      await apiFetch('/auth/reset-password', null, {
        method: 'POST',
        body: { token, password },
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando token...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Sparkles className="text-blue-400 w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MiniBio.ar</h1>
          <p className="text-gray-600">Restablecer contraseña</p>
        </div>

        <Card variant="glass" padding="large">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Nueva contraseña</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contraseña actualizada</h3>
              <p className="text-gray-600 mb-6">Ya puedes iniciar sesión con tu nueva contraseña.</p>
              <Link href="/login">
                <Button variant="primary" fullWidth>Ir a Iniciar Sesión</Button>
              </Link>
            </div>
          ) : validToken === false ? (
            <div className="text-center py-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Token inválido o expirado</h3>
              <p className="text-gray-600 mb-6">Solicita un nuevo enlace de recuperación.</p>
              <Link href="/forgot-password">
                <Button variant="primary" fullWidth>Solicitar nuevo enlace</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nueva contraseña"
                  label="Nueva contraseña"
                  required
                />
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  label="Confirmar contraseña"
                  required
                />
              </div>
              <Button type="submit" variant="primary" fullWidth loading={loading}>
                Restablecer contraseña
              </Button>
            </form>
          )}
        </Card>

        <p className="text-center text-xs text-gray-500 mt-8">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}