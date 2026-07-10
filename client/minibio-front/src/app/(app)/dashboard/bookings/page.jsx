"use client";
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';

// Estados y su presentación (igual que la centralita por página)
const STATUS = {
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmado', cls: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  no_show: { label: 'No vino', cls: 'bg-red-100 text-red-700 border-red-200' },
  done: { label: 'Completado', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const todayStr = () => new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);

const plusDays = (dateStr, n) => {
  const d = new Date(`${dateStr}T12:00:00Z`);
  return new Date(d.getTime() + n * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

const timeAR = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });

const dayLabelAR = (dateStr) =>
  new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });

// Rango de vista: hoy | próximos 7 días | próximos 30 días
const RANGES = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: 'week', label: '7 días', days: 7 },
  { key: 'month', label: '30 días', days: 30 },
];

export default function AllBookingsPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [range, setRange] = useState('week');
  const [pageFilter, setPageFilter] = useState(''); // '' = todas
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const hasBookingsFeature = !user?.plan || user.plan.features?.includes('bookings');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const from = todayStr();
      const days = RANGES.find((r) => r.key === range)?.days ?? 7;
      const to = plusDays(from, days);
      const data = await apiFetch(`/bookings/all?from=${from}&to=${to}`, token);
      setBookings(data.bookings);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, range]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasBookingsFeature) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
        <Card variant="glass" padding="large" className="max-w-md text-center p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reservas es una función Pro</h2>
          <p className="text-gray-600 mb-6">
            Actualizá tu plan para recibir reservas online en tus páginas.
          </p>
          <Link href="/dashboard">
            <Button variant="primary">Volver al dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Páginas presentes en los resultados (para el filtro y los accesos)
  const pagesInResults = [];
  bookings.forEach((b) => {
    if (!pagesInResults.some((p) => p.id === b.page.id)) pagesInResults.push(b.page);
  });

  const visible = bookings.filter((b) => !pageFilter || b.page.id === Number(pageFilter));
  const active = visible.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const pendingCount = visible.filter((b) => b.status === 'pending').length;

  // Agrupar por día (fecha argentina)
  const byDay = new Map();
  visible.forEach((b) => {
    const day = new Date(new Date(b.starts_at).getTime() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day).push(b);
  });

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Todos los turnos</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-800 font-medium">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex bg-white border-2 border-gray-200 rounded-xl p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  range === r.key ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {pagesInResults.length > 1 && (
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Todas las páginas</option>
              {pagesInResults.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          )}

          <div className="ml-auto text-sm text-gray-600">
            {active.length} turno{active.length !== 1 ? 's' : ''}
            {pendingCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                {pendingCount} por aprobar
              </span>
            )}
          </div>
        </div>

        {/* Lista agrupada por día */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <Card variant="glass" padding="large" className="text-center p-8 py-14">
            <p className="text-gray-600 font-medium mb-2">No hay turnos en este período</p>
            <p className="text-sm text-gray-400">
              Las reservas de tus clientes van a aparecer acá.
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {[...byDay.entries()].map(([day, items]) => (
              <div key={day}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3 px-1">
                  {day === todayStr() ? `Hoy · ${dayLabelAR(day)}` : dayLabelAR(day)}
                </h2>
                <div className="space-y-3">
                  {items.map((b) => (
                    <Link key={b.id} href={`/dashboard/${b.page.id}/bookings`} className="block group">
                      <Card variant="glass" padding="none" className="overflow-hidden group-hover:shadow-md transition-shadow">
                        <div className="p-4 flex items-center gap-4">
                          <div className="text-center flex-shrink-0 w-14">
                            <p className="text-lg font-bold text-gray-900">{timeAR(b.starts_at)}</p>
                          </div>
                          <div className="flex-1 min-w-[150px]">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 truncate">{b.customer_name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS[b.status]?.cls || ''}`}>
                                {STATUS[b.status]?.label || b.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{b.resource?.name}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold max-w-[130px] truncate">
                              {b.page.title}
                            </span>
                            <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
