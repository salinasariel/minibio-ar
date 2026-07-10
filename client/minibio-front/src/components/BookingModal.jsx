"use client";
import { useState, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Próximos N días como [{value:'YYYY-MM-DD', dow:'lun', day:'15', month:'jul'}]
function nextDays(n) {
  const out = [];
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000); // hoy en Argentina
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const value = d.toISOString().slice(0, 10);
    const local = new Date(`${value}T12:00:00Z`);
    out.push({
      value,
      dow: local.toLocaleDateString('es-AR', { weekday: 'short', timeZone: 'UTC' }),
      day: local.toLocaleDateString('es-AR', { day: 'numeric', timeZone: 'UTC' }),
      month: local.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }),
    });
  }
  return out;
}

const formatPrice = (p) =>
  p == null
    ? null
    : new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(p));

// Modal público de reserva: recurso → fecha y hora → datos del cliente
export default function BookingModal({ slug, onClose }) {
  const [info, setInfo] = useState(null); // { resources, settings }
  const [step, setStep] = useState(1);
  const [resource, setResource] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState(null); // null = cargando
  const [slot, setSlot] = useState(null); // { time, starts_at }
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // reserva creada
  const [linkCopied, setLinkCopied] = useState(false);

  // Cargar recursos al abrir
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_URL}/public/booking/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error('No se pudieron cargar las reservas');
        const data = await res.json();
        setInfo(data);
        // Un solo recurso: saltar directo a la fecha
        if (data.resources.length === 1) {
          setResource(data.resources[0]);
          setStep(2);
        }
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [slug]);

  // Disponibilidad al elegir fecha
  useEffect(() => {
    if (!resource || !date) return;
    setSlots(null);
    setSlot(null);
    (async () => {
      try {
        const res = await fetch(
          `${API_URL}/public/booking/${encodeURIComponent(slug)}/availability?resource_id=${resource.id}&date=${date}`
        );
        const data = await res.json();
        setSlots(data.slots || []);
      } catch {
        setSlots([]);
      }
    })();
  }, [resource, date, slug]);

  const submit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setError('Ingresá tu nombre');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) {
      setError('Ingresá un teléfono válido');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/public/booking/${encodeURIComponent(slug)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: resource.id,
          starts_at: slot.starts_at,
          customer_name: name.trim(),
          customer_phone: digits,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // Horario recién llenado: volver a la grilla actualizada
        if (res.status === 409) {
          setStep(2);
          setSlot(null);
          setSlots(null);
          const r = await fetch(
            `${API_URL}/public/booking/${encodeURIComponent(slug)}/availability?resource_id=${resource.id}&date=${date}`
          );
          setSlots((await r.json()).slots || []);
        }
        throw new Error(data.error || 'No se pudo crear la reserva');
      }
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const days = info ? nextDays(Math.min(info.settings.max_days + 1, 30)) : [];

  const dateLabel = date
    ? new Date(`${date}T12:00:00Z`).toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      })
    : '';

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            {step > 1 && !result && (
              <button
                onClick={() => {
                  setError('');
                  if (step === 3) setStep(2);
                  else if (info?.resources.length > 1) {
                    setStep(1);
                    setDate(null);
                  }
                }}
                className="p-1 -ml-2 hover:bg-gray-100 rounded-lg"
                aria-label="Volver"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h3 className="text-lg font-bold text-gray-900">
              {result ? '¡Listo!' : 'Reservar turno'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg" aria-label="Cerrar">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Confirmación final */}
          {result ? (() => {
            const cancelUrl = `${window.location.origin}${window.location.pathname}?cancelar=${result.cancel_token}`;
            const allowCancel = info?.settings?.allow_cancel !== false;
            const whenText = new Date(result.booking.starts_at).toLocaleString('es-AR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
              timeZone: 'America/Argentina/Buenos_Aires',
            });
            // Mensaje para el chat con el negocio: confirma el turno y deja
            // el link de gestión guardado en el WhatsApp del cliente
            const waText =
              `¡Hola! Reservé un turno por MiniBio:\n` +
              `📅 ${result.resource.name} — ${whenText} hs\n` +
              `👤 ${name.trim()}` +
              (allowCancel ? `\n\nMi link para cancelar si no llego: ${cancelUrl}` : '');
            const waUrl = info?.whatsapp
              ? `https://wa.me/${info.whatsapp}?text=${encodeURIComponent(waText)}`
              : null;
            return (
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${result.auto_confirmed ? 'bg-green-100' : 'bg-amber-100'}`}>
                {result.auto_confirmed ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-1">
                {result.auto_confirmed ? 'Reserva confirmada' : 'Reserva enviada'}
              </h4>
              <p className="text-gray-600 mb-4">
                {result.resource.name} ·{' '}
                {new Date(result.booking.starts_at).toLocaleString('es-AR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                  timeZone: 'America/Argentina/Buenos_Aires',
                })}{' '}
                hs
              </p>
              {!result.auto_confirmed && (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-2 mb-4">
                  El negocio va a confirmar tu turno.
                </p>
              )}

              {/* Confirmación por WhatsApp: queda el comprobante (y el link
                  de cancelación) guardado en el chat del cliente */}
              {waUrl && (
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3.5 mb-2 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1fbd5a] transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Confirmar por WhatsApp
                </a>
              )}
              {waUrl && allowCancel && (
                <p className="text-xs text-gray-400 mb-3">
                  El mensaje incluye tu link para cancelar: queda guardado en tu chat.
                </p>
              )}

              {allowCancel && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(cancelUrl).then(() => {
                      setLinkCopied(true);
                      setTimeout(() => setLinkCopied(false), 2500);
                    }).catch(() => {});
                  }}
                  className="w-full px-4 py-3 mb-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  {linkCopied ? '¡Link copiado!' : 'Copiar link para cancelar'}
                </button>
              )}
              {!allowCancel && (
                <p className="text-xs text-gray-500 mb-3">
                  Para cambios o cancelaciones, contactá al negocio directamente.
                </p>
              )}
              <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Cerrar
              </button>
            </div>
            );
          })() : !info && !error ? (
            <div className="py-10 text-center">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : (
            <>
              {/* Paso 1: recurso */}
              {step === 1 && info && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500 mb-1">¿Qué querés reservar?</p>
                  {info.resources.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setResource(r);
                        setStep(2);
                      }}
                      className="w-full p-4 bg-gray-50 hover:bg-blue-50 border-2 border-gray-100 hover:border-blue-300 rounded-2xl text-left transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-500">
                            {r.duration} min{r.description ? ` · ${r.description}` : ''}
                          </p>
                        </div>
                        {formatPrice(r.price) && (
                          <span className="font-bold text-gray-900 whitespace-nowrap">{formatPrice(r.price)}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Paso 2: fecha y hora */}
              {step === 2 && resource && (
                <div>
                  <p className="font-semibold text-gray-900 mb-3">{resource.name}</p>
                  <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
                    {days.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDate(d.value)}
                        className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 min-w-[60px] transition-colors ${
                          date === d.value
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                        }`}
                      >
                        <span className="text-[10px] uppercase font-semibold opacity-70">{d.dow}</span>
                        <span className="text-lg font-bold leading-tight">{d.day}</span>
                        <span className="text-[10px] opacity-70">{d.month}</span>
                      </button>
                    ))}
                  </div>

                  {!date ? (
                    <p className="text-sm text-gray-400 text-center py-6">Elegí un día</p>
                  ) : slots === null ? (
                    <div className="py-6 text-center">
                      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : slots.filter((s) => s.available > 0).length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No hay horarios disponibles ese día
                    </p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {slots.map((s) => (
                        <button
                          key={s.starts_at}
                          disabled={s.available === 0}
                          onClick={() => {
                            setSlot(s);
                            setStep(3);
                          }}
                          className={`px-2 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                            s.available === 0
                              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                              : 'border-gray-200 bg-white text-gray-800 hover:border-blue-400 hover:bg-blue-50'
                          }`}
                        >
                          {s.time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Paso 3: datos */}
              {step === 3 && slot && (
                <div>
                  <div className="p-3 bg-blue-50 rounded-xl mb-4 text-sm text-blue-900">
                    <span className="font-bold">{resource.name}</span> · {dateLabel} · {slot.time} hs
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={60}
                        placeholder="Nombre y apellido"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tu teléfono *</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={20}
                        placeholder="Ej: 341 5 123456"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        El negocio te contacta por acá si hay cambios
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota (opcional)</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        maxLength={200}
                        placeholder="Algo que el negocio deba saber"
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <button
                      onClick={submit}
                      disabled={submitting}
                      className="w-full px-4 py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Reservando...' : 'Confirmar reserva'}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 font-medium">{error}</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
