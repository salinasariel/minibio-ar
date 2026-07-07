"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Card from '@/components/Card';

export default function ReferralsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const d = await apiFetch('/referrals', token);
        setData(d);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  const referralLink = data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${data.code}`
    : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Referidos</h1>
          <span className="w-16"></span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {data && (
          <>
            {/* Estado del premio */}
            <Card className={`border mb-6 ${data.rewarded ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
              <div className="p-5">
                {data.rewarded ? (
                  <>
                    <h2 className="font-bold text-green-800 text-lg mb-1">Tenés Pro por referidos 🎉</h2>
                    <p className="text-sm text-green-700">
                      Se mantiene mientras al menos uno de tus referidos siga activo
                      ({data.rules.maintain_clicks_30d}+ clicks en los últimos 30 días).
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="font-bold text-gray-900 text-lg mb-1">Invitá y ganá Pro</h2>
                    <p className="text-sm text-gray-600">
                      Compartí tu link. Cuando alguien crea su cuenta con él y sus links juntan{' '}
                      <strong>{data.rules.qualify_clicks} clicks</strong>, te regalamos el plan Pro.
                      Se mantiene mientras tu referido siga activo ({data.rules.maintain_clicks_30d}+ clicks
                      en los últimos 30 días).
                    </p>
                  </>
                )}
              </div>
            </Card>

            {/* Link de invitación */}
            <Card className="border border-gray-200 mb-6">
              <div className="p-5">
                <p className="text-sm font-medium text-gray-700 mb-2">Tu link de invitación</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referralLink}
                    className="flex-1 px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-mono"
                    onFocus={(e) => e.target.select()}
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-colors whitespace-nowrap"
                  >
                    {copied ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            </Card>

            {/* Lista de referidos */}
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Tus referidos ({data.referrals.length})
            </h2>
            {data.referrals.length === 0 ? (
              <Card className="border border-gray-200">
                <p className="p-6 text-center text-gray-500">
                  Todavía no referiste a nadie. ¡Compartí tu link!
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {data.referrals.map((r) => (
                  <Card key={r.username} className="border border-gray-200">
                    <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-semibold text-gray-900">@{r.username}</p>
                        <p className="text-xs text-gray-400">
                          Se sumó el {new Date(r.created_at).toLocaleDateString('es-AR')}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          r.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : r.status === 'idle'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {r.status === 'active'
                          ? 'Activo'
                          : r.status === 'idle'
                            ? 'Sin actividad reciente'
                            : 'Aún no califica'}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
