"use client";
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';
import { Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Ingresa tu email primero');
      return;
    }
    setResending(true);
    setResendMsg('');
    try {
      await apiFetch('/auth/resend-verification', null, {
        method: 'POST',
        body: { email },
      });
      setResendMsg('Se ha reenviado el enlace de verificación a tu email');
    } catch (err) {
      setResendMsg(err.message || 'Error al reenviar');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fafaf8] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400 hidden"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-400 hidden" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 hidden" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">MiniBio.ar</h1>
          <p className="text-gray-600">Tu (mini) link-in-bio personalizado</p>
        </div>

        <Card className='p-6 ' variant="glass" padding="large">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 animate-slide-up">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-800 font-medium">{error}</p>
            </div>
          )}

          {resendMsg && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-slide-up ${resendMsg.includes('reenviado') ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
              <svg className={`w-5 h-5 flex-shrink-0 ${resendMsg.includes('reenviado') ? 'text-green-600' : 'text-red-600'}`} fill="currentColor" viewBox="0 0 20 20">
                {resendMsg.includes('reenviado') ? (
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                )}
              </svg>
              <p className={`text-sm font-medium ${resendMsg.includes('reenviado') ? 'text-green-800' : 'text-red-800'}`}>{resendMsg}</p>
            </div>
          )}

          <div className="text-gray-900 space-y-5">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              label="Email"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              label="Contraseña"
              required
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              onClick={handleSubmit}
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
            >
              Entrar
            </Button>
          </div>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending || !email}
              className="text-sm text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
            >
              {resending ? 'Reenviando...' : '¿No recibiste el email de verificación? Reenvía'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-8">
          Al continuar, aceptas nuestros <Link href="/terms" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">términos y condiciones</Link>
        </p>
      </div>
    </div>
  );
}