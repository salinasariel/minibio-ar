"use client";
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { DAY_KEYS, DAY_NAMES } from '@/lib/hours';

// Estados de un turno y su presentación
const STATUS = {
  pending: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed: { label: 'Confirmado', cls: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelado', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
  no_show: { label: 'No vino', cls: 'bg-red-100 text-red-700 border-red-200' },
  done: { label: 'Completado', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
};

const todayStr = () => {
  // Fecha de hoy en Argentina (UTC-3)
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
};

const timeAR = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Argentina/Buenos_Aires',
  });

const EMPTY_RESOURCE = { name: '', description: '', quantity: 1, duration: 60, price: '', active: true, ownHours: false, hours: null };

const DEFAULT_DAY = { open: '09:00', close: '18:00' };

export default function BookingsAdminPage() {
  const { pageId } = useParams();
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(null);
  const [tab, setTab] = useState('agenda'); // agenda | recursos | config
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Agenda
  const [date, setDate] = useState(todayStr());
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Recursos
  const [resources, setResources] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editingResource, setEditingResource] = useState(null); // null | 'new' | id
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE);
  const [savingResource, setSavingResource] = useState(false);

  // Turno manual
  const [showManual, setShowManual] = useState(false);
  const [manual, setManual] = useState({ resource_id: '', date: todayStr(), time: '', name: '', phone: '', notes: '' });
  const [manualSlots, setManualSlots] = useState([]);
  const [savingManual, setSavingManual] = useState(false);

  // Configuración
  const [exceptions, setExceptions] = useState([]);
  const [newException, setNewException] = useState({ date: '', reason: '' });

  const flash = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 2500);
  };
  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 4000);
  };

  const hasBookingsFeature = !user?.plan || user.plan.features?.includes('bookings');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Datos base: página + recursos + settings + excepciones
  useEffect(() => {
    if (!token || !pageId) return;
    (async () => {
      try {
        const [p, r, ex] = await Promise.all([
          apiFetch(`/pages/${pageId}`, token),
          apiFetch(`/bookings/resources/${pageId}`, token),
          apiFetch(`/bookings/exceptions/${pageId}`, token),
        ]);
        setPage(p);
        setResources(r.resources);
        setSettings(r.settings);
        setExceptions(ex.exceptions);
      } catch (err) {
        showError(err.message);
      }
    })();
  }, [token, pageId]);

  // Agenda del día seleccionado
  const fetchBookings = useCallback(async () => {
    if (!token || !pageId) return;
    setLoadingBookings(true);
    try {
      const data = await apiFetch(`/bookings/page/${pageId}?from=${date}&to=${date}`, token);
      setBookings(data.bookings);
    } catch (err) {
      showError(err.message);
    } finally {
      setLoadingBookings(false);
    }
  }, [token, pageId, date]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Slots disponibles para el alta manual
  useEffect(() => {
    if (!showManual || !manual.resource_id || !manual.date || !page?.slug) {
      setManualSlots([]);
      return;
    }
    (async () => {
      try {
        const data = await apiFetch(
          `/public/booking/${page.slug}/availability?resource_id=${manual.resource_id}&date=${manual.date}`
        );
        setManualSlots(data.slots);
      } catch {
        setManualSlots([]);
      }
    })();
  }, [showManual, manual.resource_id, manual.date, page?.slug]);

  // ========================================
  // Acciones
  // ========================================
  const changeStatus = async (id, status) => {
    try {
      const updated = await apiFetch(`/bookings/${id}`, token, { method: 'PATCH', body: { status } });
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
      flash('Turno actualizado');
    } catch (err) {
      showError(err.message);
    }
  };

  const createManual = async () => {
    if (!manual.resource_id || !manual.time || !manual.name.trim() || !manual.phone.trim()) {
      showError('Completá recurso, horario, nombre y teléfono');
      return;
    }
    setSavingManual(true);
    try {
      await apiFetch('/bookings/manual', token, {
        method: 'POST',
        body: {
          page_id: Number(pageId),
          resource_id: Number(manual.resource_id),
          starts_at: manual.time,
          customer_name: manual.name,
          customer_phone: manual.phone,
          notes: manual.notes || undefined,
        },
      });
      setShowManual(false);
      setManual({ resource_id: '', date: todayStr(), time: '', name: '', phone: '', notes: '' });
      flash('Turno agregado');
      if (manual.date === date) fetchBookings();
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingManual(false);
    }
  };

  const openResourceForm = (r) => {
    if (r) {
      setEditingResource(r.id);
      setResourceForm({
        name: r.name,
        description: r.description || '',
        quantity: r.quantity,
        duration: r.duration,
        price: r.price ?? '',
        active: r.active,
        ownHours: Boolean(r.hours),
        hours: r.hours,
      });
    } else {
      setEditingResource('new');
      setResourceForm(EMPTY_RESOURCE);
    }
  };

  const saveResource = async () => {
    if (!resourceForm.name.trim()) {
      showError('El recurso necesita un nombre');
      return;
    }
    setSavingResource(true);
    const body = {
      name: resourceForm.name,
      description: resourceForm.description || '',
      quantity: Number(resourceForm.quantity),
      duration: Number(resourceForm.duration),
      price: resourceForm.price === '' ? null : Number(resourceForm.price),
      active: resourceForm.active,
      hours: resourceForm.ownHours ? resourceForm.hours : null,
    };
    try {
      if (editingResource === 'new') {
        const created = await apiFetch('/bookings/resources', token, {
          method: 'POST',
          body: { ...body, page_id: Number(pageId) },
        });
        setResources((prev) => [...prev, { ...created, _count: { bookings: 0 } }]);
      } else {
        const updated = await apiFetch(`/bookings/resources/${editingResource}`, token, {
          method: 'PUT',
          body,
        });
        setResources((prev) => prev.map((r) => (r.id === editingResource ? { ...r, ...updated } : r)));
      }
      setEditingResource(null);
      flash('Recurso guardado');
    } catch (err) {
      showError(err.message);
    } finally {
      setSavingResource(false);
    }
  };

  const deleteResource = async (id) => {
    if (!confirm('¿Eliminar este recurso? Se borran también sus turnos.')) return;
    try {
      await apiFetch(`/bookings/resources/${id}`, token, { method: 'DELETE' });
      setResources((prev) => prev.filter((r) => r.id !== id));
      flash('Recurso eliminado');
    } catch (err) {
      showError(err.message);
    }
  };

  const saveSettings = async (patch) => {
    try {
      const data = await apiFetch(`/bookings/settings/${pageId}`, token, {
        method: 'PUT',
        body: patch,
      });
      setSettings(data.settings);
      flash('Configuración guardada');
    } catch (err) {
      showError(err.message);
    }
  };

  const addException = async () => {
    if (!newException.date) {
      showError('Elegí una fecha');
      return;
    }
    try {
      const created = await apiFetch('/bookings/exceptions', token, {
        method: 'POST',
        body: { page_id: Number(pageId), date: newException.date, reason: newException.reason || '' },
      });
      setExceptions((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      setNewException({ date: '', reason: '' });
      flash('Fecha bloqueada');
    } catch (err) {
      showError(err.message);
    }
  };

  const removeException = async (id) => {
    try {
      await apiFetch(`/bookings/exceptions/${id}`, token, { method: 'DELETE' });
      setExceptions((prev) => prev.filter((e) => e.id !== id));
      flash('Bloqueo eliminado');
    } catch (err) {
      showError(err.message);
    }
  };

  // Editor de horario semanal (para recursos con horario propio)
  const setDay = (key, patch) => {
    setResourceForm((f) => ({
      ...f,
      hours: { ...(f.hours || {}), [key]: { ...(f.hours?.[key] || {}), ...patch } },
    }));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Gate por plan: reservas es una feature Pro
  if (!hasBookingsFeature) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center p-4">
        <Card variant="glass" padding="large" className="max-w-md text-center p-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reservas es una función Pro</h2>
          <p className="text-gray-600 mb-6">
            Actualizá tu plan para que tus clientes reserven turnos directamente desde tu página.
          </p>
          <Link href="/dashboard">
            <Button variant="primary">Volver al dashboard</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const activeBookings = bookings.filter((b) => ['pending', 'confirmed'].includes(b.status));
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
              title="Volver"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">Turnos</h1>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{page?.title || '...'}</p>
            </div>
          </div>
          <Button variant="primary" size="small" onClick={() => { setShowManual(true); setTab('agenda'); }}>
            + Agregar turno
          </Button>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 flex gap-1">
          {[
            ['agenda', 'Agenda'],
            ['recursos', 'Recursos'],
            ['config', 'Configuración'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl text-sm text-red-800 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl text-sm text-green-800 font-medium">
            {success}
          </div>
        )}

        {/* Aviso: sin recursos todavía */}
        {resources.length === 0 && tab !== 'recursos' && (
          <Card variant="glass" padding="large" className="mb-6 text-center p-8">
            <p className="text-gray-700 font-medium mb-3">
              Todavía no configuraste qué se puede reservar.
            </p>
            <Button variant="primary" onClick={() => { setTab('recursos'); openResourceForm(null); }}>
              Crear mi primer recurso
            </Button>
            <p className="text-xs text-gray-500 mt-3">
              Un recurso es lo que tus clientes reservan: "Corte de pelo", "Cancha de 5", "Mesa para 4"...
            </p>
          </Card>
        )}

        {/* ============ AGENDA ============ */}
        {tab === 'agenda' && (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={() => setDate(todayStr())}
                className="px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl"
              >
                Hoy
              </button>
              <div className="ml-auto text-sm text-gray-600">
                {activeBookings.length} turno{activeBookings.length !== 1 ? 's' : ''}
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                    {pendingCount} por aprobar
                  </span>
                )}
              </div>
            </div>

            {/* Alta manual */}
            {showManual && (
              <Card variant="glass" padding="large" className="mb-6 animate-scale-in p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo turno manual</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurso</label>
                    <select
                      value={manual.resource_id}
                      onChange={(e) => setManual({ ...manual, resource_id: e.target.value, time: '' })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="">Elegir...</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                    <input
                      type="date"
                      value={manual.date}
                      onChange={(e) => setManual({ ...manual, date: e.target.value, time: '' })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                    {manualSlots.length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">
                        {manual.resource_id ? 'Sin horarios disponibles ese día' : 'Elegí un recurso y una fecha'}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {manualSlots.map((s) => (
                          <button
                            key={s.starts_at}
                            type="button"
                            disabled={s.available === 0}
                            onClick={() => setManual({ ...manual, time: s.starts_at })}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-colors ${
                              manual.time === s.starts_at
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : s.available === 0
                                  ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                  : 'border-gray-200 bg-white text-gray-800 hover:border-indigo-300'
                            }`}
                          >
                            {s.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    label="Nombre del cliente"
                    value={manual.name}
                    onChange={(e) => setManual({ ...manual, name: e.target.value })}
                    placeholder="Juan Pérez"
                  />
                  <Input
                    label="Teléfono"
                    value={manual.phone}
                    onChange={(e) => setManual({ ...manual, phone: e.target.value })}
                    placeholder="341 5 123456"
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Nota (opcional)"
                      value={manual.notes}
                      onChange={(e) => setManual({ ...manual, notes: e.target.value })}
                      placeholder="Ej: pidió con Marcos"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button variant="primary" onClick={createManual} loading={savingManual}>
                    Guardar turno
                  </Button>
                  <Button variant="secondary" onClick={() => setShowManual(false)}>
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}

            {/* Lista de turnos */}
            {loadingBookings ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : bookings.length === 0 ? (
              <Card variant="glass" padding="large" className="text-center p-8 py-12">
                <p className="text-gray-500 font-medium">No hay turnos para este día</p>
              </Card>
            ) : (
              /* Planilla de turnos del día */
              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
                <table className="w-full text-sm min-w-[760px]">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
                      <th className="px-4 py-3 font-semibold">Hora</th>
                      <th className="px-4 py-3 font-semibold">Cliente</th>
                      <th className="px-4 py-3 font-semibold">Teléfono</th>
                      <th className="px-4 py-3 font-semibold">Recurso</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.map((b) => (
                      <tr key={b.id} className={`hover:bg-gray-50/70 transition-colors ${['cancelled', 'no_show'].includes(b.status) ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-gray-900">{timeAR(b.starts_at)}</span>
                          <span className="text-gray-400 text-xs"> – {timeAR(b.ends_at)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-gray-900">
                            {b.customer_name}
                            {b.created_by_owner && (
                              <span className="ml-1.5 text-[10px] font-normal text-gray-400">manual</span>
                            )}
                          </p>
                          {b.notes && <p className="text-xs text-gray-400 truncate max-w-[200px]">{b.notes}</p>}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <a
                            href={`https://wa.me/${b.customer_phone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#128C42] font-semibold hover:underline"
                            title="Contactar por WhatsApp"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {b.customer_phone}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{b.resource?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${STATUS[b.status]?.cls || ''}`}>
                            {STATUS[b.status]?.label || b.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            {b.status === 'pending' && (
                              <button
                                onClick={() => changeStatus(b.id, 'confirmed')}
                                className="px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700"
                              >
                                Confirmar
                              </button>
                            )}
                            {['pending', 'confirmed'].includes(b.status) && (
                              <>
                                <button
                                  onClick={() => changeStatus(b.id, 'done')}
                                  className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold hover:bg-blue-100"
                                  title="Marcar como completado"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => changeStatus(b.id, 'no_show')}
                                  className="px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100"
                                  title="El cliente no vino"
                                >
                                  No vino
                                </button>
                                <button
                                  onClick={() => changeStatus(b.id, 'cancelled')}
                                  className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-200"
                                >
                                  Cancelar
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ============ RECURSOS ============ */}
        {tab === 'recursos' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">
                Qué se puede reservar ({resources.length})
              </h2>
              <Button variant="primary" size="small" onClick={() => openResourceForm(null)}>
                + Nuevo recurso
              </Button>
            </div>

            {editingResource !== null && (
              <Card variant="glass" padding="large" className="mb-6 animate-scale-in p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  {editingResource === 'new' ? 'Nuevo recurso' : 'Editar recurso'}
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Nombre"
                    value={resourceForm.name}
                    onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                    placeholder='Ej: "Corte de pelo", "Cancha de 5", "Mesa para 4"'
                  />
                  <Input
                    label="Descripción (opcional)"
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    placeholder="Ej: incluye lavado"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cantidad simultánea
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={resourceForm.quantity}
                      onChange={(e) => setResourceForm({ ...resourceForm, quantity: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cuántos turnos entran a la misma hora (sillas, canchas, mesas...)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duración del turno (minutos)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="480"
                      step="5"
                      value={resourceForm.duration}
                      onChange={(e) => setResourceForm({ ...resourceForm, duration: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <Input
                    label="Precio (opcional)"
                    type="number"
                    value={resourceForm.price}
                    onChange={(e) => setResourceForm({ ...resourceForm, price: e.target.value })}
                    placeholder="Se muestra al reservar"
                  />
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={resourceForm.active}
                        onChange={(e) => setResourceForm({ ...resourceForm, active: e.target.checked })}
                        className="w-4 h-4 rounded"
                      />
                      Visible para reservar
                    </label>
                  </div>
                </div>

                {/* Horario propio */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={resourceForm.ownHours}
                      onChange={(e) =>
                        setResourceForm({
                          ...resourceForm,
                          ownHours: e.target.checked,
                          hours: e.target.checked
                            ? resourceForm.hours || Object.fromEntries(DAY_KEYS.map((k) => [k, { ...DEFAULT_DAY }]))
                            : resourceForm.hours,
                        })
                      }
                      className="w-4 h-4 rounded"
                    />
                    Horario propio (si no, usa el horario de la página)
                  </label>
                  {resourceForm.ownHours && (
                    <div className="space-y-2">
                      {DAY_KEYS.map((k) => {
                        const d = resourceForm.hours?.[k] || {};
                        const closed = d.closed || false;
                        return (
                          <div key={k} className="flex items-center gap-3 text-sm">
                            <span className="w-20 text-gray-700 font-medium">{DAY_NAMES[k]}</span>
                            <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!closed}
                                onChange={(e) => setDay(k, { closed: !e.target.checked })}
                                className="w-3.5 h-3.5 rounded"
                              />
                              Abierto
                            </label>
                            {!closed && (
                              <>
                                <input
                                  type="time"
                                  value={d.open || '09:00'}
                                  onChange={(e) => setDay(k, { open: e.target.value })}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900"
                                />
                                <span className="text-gray-400">a</span>
                                <input
                                  type="time"
                                  value={d.close || '18:00'}
                                  onChange={(e) => setDay(k, { close: e.target.value })}
                                  className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-900"
                                />
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-5">
                  <Button variant="primary" onClick={saveResource} loading={savingResource}>
                    Guardar
                  </Button>
                  <Button variant="secondary" onClick={() => setEditingResource(null)}>
                    Cancelar
                  </Button>
                </div>
              </Card>
            )}

            {resources.length === 0 && editingResource === null ? (
              <Card variant="glass" padding="large" className="text-center p-8 py-10">
                <p className="text-gray-600 mb-2 font-medium">Creá tu primer recurso reservable</p>
                <p className="text-sm text-gray-500 mb-4">
                  Barbería: "Corte" ×2 sillas · Cancha: "Cancha de 5" ×2 · Restaurant: "Mesa para 4" ×3
                </p>
                <Button variant="primary" onClick={() => openResourceForm(null)}>
                  + Nuevo recurso
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 items-start">
                {resources.map((r) => (
                  <Card key={r.id} variant="glass" padding="none" className="flex flex-col">
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-gray-900 truncate">{r.name}</p>
                        {!r.active && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-[11px] font-semibold flex-shrink-0">
                            Oculto
                          </span>
                        )}
                      </div>
                      {r.description && (
                        <p className="text-xs text-gray-400 mb-1.5 line-clamp-1">{r.description}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 text-xs">
                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-semibold">
                          ×{r.quantity} simultáneo{r.quantity !== 1 ? 's' : ''}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg font-semibold">
                          {r.duration} min
                        </span>
                        {r.price != null && r.price !== '' && (
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg font-semibold">
                            ${Number(r.price).toLocaleString('es-AR')}
                          </span>
                        )}
                        {r.hours && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg font-semibold">
                            horario propio
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="border-t border-gray-100 p-2.5 flex gap-2">
                      <button
                        onClick={() => openResourceForm(r)}
                        className="flex-1 px-3 py-1.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteResource(r.id)}
                        className="px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Borrar
                      </button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ CONFIGURACIÓN ============ */}
        {tab === 'config' && settings && (
          <div className="space-y-6 pb-12">
            {/* Cómo se reserva */}
            <Card variant="glass" padding="large" className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cómo se reserva</h3>
              <p className="text-sm text-gray-500 mb-5">
                Qué pasa cuando un cliente pide un turno desde tu página.
              </p>
              <div className="divide-y divide-gray-100">
                <label className="flex items-center justify-between gap-4 py-4 cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Aceptar reservas online</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Muestra el botón "Reservar turno" en tu página pública
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => saveSettings({ enabled: e.target.checked })}
                    className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                  />
                </label>
                <label className="flex items-center justify-between gap-4 py-4 cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Confirmar turnos automáticamente</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Encendido: el turno queda confirmado al instante. Apagado: queda
                      "pendiente" y lo aprobás vos desde la agenda.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.auto_confirm}
                    onChange={(e) => saveSettings({ auto_confirm: e.target.checked })}
                    className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                  />
                </label>
                <div className="grid sm:grid-cols-2 gap-4 py-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Reservan hasta con... (días)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      defaultValue={settings.max_days}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (v && v !== settings.max_days) saveSettings({ max_days: v });
                      }}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Ej: 30 = pueden reservar hasta con un mes de anticipación
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Aviso mínimo (minutos)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="2880"
                      step="15"
                      defaultValue={settings.min_minutes}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== settings.min_minutes) saveSettings({ min_minutes: v });
                      }}
                      className="w-full px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Ej: 60 = no pueden reservar un turno que empieza en menos de 1 hora
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Cancelaciones */}
            <Card variant="glass" padding="large" className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Cancelaciones</h3>
              <p className="text-sm text-gray-500 mb-5">
                El cliente recibe un link con su reserva. Acá decidís si puede usarlo para cancelar.
              </p>
              <div className="divide-y divide-gray-100">
                <label className="flex items-center justify-between gap-4 py-4 cursor-pointer">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Permitir cancelar online</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Apagado: para cancelar tienen que contactarte por WhatsApp
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allow_cancel !== false}
                    onChange={(e) => saveSettings({ allow_cancel: e.target.checked })}
                    className="w-5 h-5 rounded accent-indigo-600 flex-shrink-0"
                  />
                </label>
                {settings.allow_cancel !== false && (
                  <div className="py-4">
                    <label className="block text-sm font-semibold text-gray-900 mb-1">
                      Pueden cancelar hasta... (horas antes del turno)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="168"
                      defaultValue={settings.cancel_hours ?? 0}
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v) && v !== settings.cancel_hours) saveSettings({ cancel_hours: v });
                      }}
                      className="w-full sm:w-48 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      0 = pueden cancelar hasta el inicio · 24 = solo hasta un día antes
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card variant="glass" padding="large" className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-1">Fechas bloqueadas</h3>
              <p className="text-sm text-gray-500 mb-4">
                Feriados o días que no atendés: no se podrán reservar.
              </p>
              <div className="flex flex-wrap gap-3 mb-4">
                <input
                  type="date"
                  value={newException.date}
                  onChange={(e) => setNewException({ ...newException, date: e.target.value })}
                  className="px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
                <input
                  type="text"
                  value={newException.reason}
                  onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                  placeholder="Motivo (opcional)"
                  maxLength={80}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-sm text-gray-900 focus:border-indigo-500 focus:outline-none"
                />
                <Button variant="primary" size="small" onClick={addException}>
                  Bloquear
                </Button>
              </div>
              {exceptions.length === 0 ? (
                <p className="text-sm text-gray-400">Sin fechas bloqueadas</p>
              ) : (
                <div className="space-y-2">
                  {exceptions.map((ex) => (
                    <div
                      key={ex.id}
                      className="flex items-center justify-between px-4 py-2.5 bg-white rounded-xl border border-gray-200"
                    >
                      <div className="text-sm">
                        <span className="font-semibold text-gray-900">
                          {new Date(ex.date).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'long' })}
                        </span>
                        {ex.reason && <span className="text-gray-500"> · {ex.reason}</span>}
                        {ex.resource && <span className="text-gray-400"> · solo {ex.resource.name}</span>}
                      </div>
                      <button
                        onClick={() => removeException(ex.id)}
                        className="text-red-500 hover:bg-red-50 rounded-lg px-2 py-1 text-xs font-semibold"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
