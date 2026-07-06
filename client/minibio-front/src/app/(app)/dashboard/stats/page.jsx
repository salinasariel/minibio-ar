"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Card from '@/components/Card';
import Link from 'next/link';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar';

export default function StatsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const data = await apiFetch('/stats', token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [token]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Serie diaria de los últimos 14 días para el gráfico
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  const dailyMap = {};
  (stats?.daily || []).forEach((e) => {
    dailyMap[`${e.day}:${e.type}`] = Number(e.count);
  });
  const series = days.map((day) => ({
    day,
    views: dailyMap[`${day}:view`] || 0,
    clicks: dailyMap[`${day}:click`] || 0,
  }));
  const maxBar = Math.max(1, ...series.map((s) => Math.max(s.views, s.clicks)));

  const totals = stats?.totals || {};

  const summaryCards = [
    { label: 'Visitas totales', value: totals.views ?? 0, sub: `${totals.views_last7 ?? 0} esta semana`, color: 'text-blue-600' },
    { label: 'Clicks totales', value: totals.clicks ?? 0, sub: `${totals.clicks_last7 ?? 0} esta semana`, color: 'text-purple-600' },
    { label: 'CTR global', value: totals.ctr !== null && totals.ctr !== undefined ? `${totals.ctr}%` : '—', sub: 'clicks / visitas', color: 'text-emerald-600' },
    { label: 'Páginas', value: totals.pages ?? 0, sub: `${totals.links ?? 0} links · ${totals.menu_items ?? 0} productos`, color: 'text-gray-900' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Estadísticas</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {/* Resumen global */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryCards.map((c) => (
            <Card key={c.label} variant="glass" padding="medium" className="p-4">
              <p className="text-xs text-gray-500 font-medium mb-1">{c.label}</p>
              <p className={`text-3xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </Card>
          ))}
        </div>

        {/* Actividad últimos 14 días */}
        <Card variant="glass" padding="large" className="p-5 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Últimos 14 días</h2>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span> Visitas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-sm bg-purple-500 inline-block"></span> Clicks
              </span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-40">
            {series.map((s) => (
              <div key={s.day} className="flex-1 flex items-end justify-center gap-0.5 h-full" title={`${s.day}: ${s.views} visitas, ${s.clicks} clicks`}>
                <div
                  className="w-1/2 max-w-4 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                  style={{ height: `${(s.views / maxBar) * 100}%`, minHeight: s.views > 0 ? '4px' : '1px' }}
                ></div>
                <div
                  className="w-1/2 max-w-4 bg-purple-500 rounded-t hover:bg-purple-600 transition-colors"
                  style={{ height: `${(s.clicks / maxBar) * 100}%`, minHeight: s.clicks > 0 ? '4px' : '1px' }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-2">
            <span>{series[0]?.day.slice(5)}</span>
            <span>hoy</span>
          </div>
        </Card>

        {/* Top links global */}
        {stats?.top_links?.length > 0 && (
          <Card variant="glass" padding="large" className="p-5 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top links</h2>
            <div className="space-y-2">
              {stats.top_links.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{l.title}</p>
                    <p className="text-xs text-gray-400 truncate">{l.page_title} · {l.url}</p>
                  </div>
                  <span className="text-sm font-bold text-purple-600 whitespace-nowrap">{l.clicks} clicks</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Por página */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Por página</h2>
        {(stats?.pages || []).length === 0 ? (
          <Card variant="elevated" padding="large">
            <p className="text-center text-gray-600 py-8">Todavía no tenés páginas. ¡Creá la primera desde el dashboard!</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {stats.pages.map((p) => (
              <Card key={p.id} variant="glass" padding="none" className="overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{p.title}</h3>
                      <p className="text-xs text-blue-600">{p.slug}.{ROOT_DOMAIN}</p>
                    </div>
                    <Link
                      href={`/dashboard/${p.id}/edit`}
                      className="text-sm text-blue-600 hover:underline font-medium whitespace-nowrap"
                    >
                      Editar →
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Visitas</p>
                      <p className="text-xl font-bold text-blue-600">{p.views}</p>
                      <p className="text-[10px] text-gray-400">{p.views_last7} esta semana</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Clicks</p>
                      <p className="text-xl font-bold text-purple-600">{p.clicks}</p>
                      <p className="text-[10px] text-gray-400">{p.clicks_last7} esta semana</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">CTR</p>
                      <p className="text-xl font-bold text-emerald-600">{p.ctr !== null ? `${p.ctr}%` : '—'}</p>
                      <p className="text-[10px] text-gray-400">clicks / visitas</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">Contenido</p>
                      <p className="text-xl font-bold text-gray-900">{p.links_count}</p>
                      <p className="text-[10px] text-gray-400">links · {p.menu_active}/{p.menu_count} productos activos</p>
                    </div>
                  </div>

                  {p.top_links.length > 0 && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 font-medium hover:text-gray-900">
                        Links más clickeados
                      </summary>
                      <div className="mt-2 space-y-1">
                        {p.top_links.map((l) => (
                          <div key={l.id} className="flex justify-between gap-3 py-1 border-b border-gray-100 last:border-0">
                            <span className="text-gray-700 truncate">{l.title}</span>
                            <span className="text-purple-600 font-semibold whitespace-nowrap">{l.clicks}</span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
