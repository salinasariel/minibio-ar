"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';

export default function StatsPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiFetch('/api/pages/stats', token);
        setStats(data);
      } catch (err) {
        setError(err.message || 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando estadísticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="p-6 max-w-md text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <p className="text-gray-700 mb-4">{error}</p>
          <Link href="/dashboard">
            <Button variant="primary">Volver al Dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Estadísticas</h1>
            <p className="text-gray-600 mt-1">Métricas de tus páginas y links</p>
          </div>
          <Link href="/dashboard">
            <Button variant="secondary">Volver</Button>
          </Link>
        </div>

        {stats && (
          <>
            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Visitas totales</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total_views.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">Últimos 30 días: {stats.recent_views_30d.toLocaleString()}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Clics totales</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total_clicks.toLocaleString()}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Páginas activas</div>
                <div className="text-3xl font-bold text-gray-900">{stats.top_pages_by_views.length}</div>
              </Card>
              <Card className="p-6">
                <div className="text-sm font-medium text-gray-500 mb-1">Links creados</div>
                <div className="text-3xl font-bold text-gray-900">{stats.top_links_by_clicks.length}</div>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Top Páginas por Visitas */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Páginas por Visitas</h2>
                {stats.top_pages_by_views.length === 0 ? (
                  <p className="text-gray-500 italic">No hay datos aún</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.top_pages_by_views.map((page, idx) => (
                      <li key={page.page_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400">#{idx + 1}</span>
                          <span className="text-gray-900">{page.title}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{page.views.toLocaleString()} visitas</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              {/* Top Links por Clics */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Top Links por Clics</h2>
                {stats.top_links_by_clicks.length === 0 ? (
                  <p className="text-gray-500 italic">No hay datos aún</p>
                ) : (
                  <ul className="space-y-3">
                    {stats.top_links_by_clicks.map((link, idx) => (
                      <li key={link.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-400">#{idx + 1}</span>
                          <span className="text-gray-900 truncate max-w-xs">{link.title}</span>
                        </div>
                        <span className="font-semibold text-gray-700">{link.clicks.toLocaleString()} clics</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}