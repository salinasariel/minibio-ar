"use client";
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { getThemeView } from '@/lib/themes';
import { LinkIcon } from '@/lib/linkIcons';
import { DAY_KEYS, DAY_NAMES, hasHours, isOpenNow } from '@/lib/hours';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PublicProfilePage() {
  const { pageName } = useParams(); // slug de la página

  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { src, alt } | null
  const [qrDataUrl, setQrDataUrl] = useState(null); // data-URL del QR (modal abierto si != null)
  const [shareMsg, setShareMsg] = useState('');
  const [aliasCopied, setAliasCopied] = useState(false);

  const copyAlias = async () => {
    try {
      await navigator.clipboard.writeText(profile.payment_alias);
      setAliasCopied(true);
      setTimeout(() => setAliasCopied(false), 2000);
    } catch {}
  };

  const pageUrl = () => (typeof window !== 'undefined' ? window.location.href : '');

  const handleShowQr = async () => {
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = document.createElement('canvas');

      // Corrección 'H' aguanta hasta 30% tapado: permite el logo en el centro
      await QRCode.toCanvas(canvas, pageUrl(), {
        width: 640,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: '#111827', light: '#ffffff' },
      });

      // Logo en el centro: avatar de la página (si hay)
      if (profile?.avatar_url) {
        try {
          const logo = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = profile.avatar_url;
          });

          const ctx = canvas.getContext('2d');
          const size = canvas.width * 0.22;
          const x = (canvas.width - size) / 2;

          // Fondo blanco circular + avatar recortado en círculo
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.width / 2, size / 2 + 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(canvas.width / 2, canvas.width / 2, size / 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(logo, x, x, size, size);
          ctx.restore();
        } catch {
          // Si el avatar no se puede dibujar (CORS), queda el QR sin logo
        }
      }

      setQrDataUrl(canvas.toDataURL('image/png'));
    } catch (err) {
      console.error('QR error:', err);
    }
  };

  const handleShare = async () => {
    const url = pageUrl();
    const title = displayName ? `${displayName} en MiniBio` : 'Mi MiniBio';
    const text = `Mirá ${displayName || 'este MiniBio'}: ${url}`;

    // Share nativo (móvil): abre WhatsApp, Instagram, etc.
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // usuario canceló → no hacer nada
        return;
      }
    }

    // Desktop sin Web Share: copiar link + abrir WhatsApp Web
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Link copiado!');
      setTimeout(() => setShareMsg(''), 2500);
    } catch {}
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  useEffect(() => {
    if (!pageName) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/public/page-by-slug/${encodeURIComponent(pageName)}`);

        if (!res.ok) {
          throw new Error('Página no encontrada');
        }

        const data = await res.json();
        setProfile(data.profile);
        setLinks(data.links || []);
        setMenus(data.menus || []);

        // Registrar visita (fire & forget)
        fetch(`${API_URL}/public/track/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: data.profile?.slug || pageName }),
        }).catch(() => {});
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [pageName]);

  const handleLinkClick = (linkId, url) => {
    // Registrar click sin bloquear la navegación
    fetch(`${API_URL}/links/${linkId}/click`, { method: 'POST' }).catch(() => {});
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const themeView = getThemeView(profile?.theme);
  // Prioridad: título de la página > nombre del usuario > username
  const displayName = profile?.title || profile?.display_name || profile?.username || '';
  const initial = (displayName || '?').charAt(0).toUpperCase();

  const formatPrice = (price) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${themeView.className}`}
        style={themeView.style}
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 p-4">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-xl mb-6">Página no encontrada</p>
          <a
            href="https://minibio.ar"
            className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${themeView.className} relative overflow-hidden`}
      style={themeView.style}
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="text-center mb-8 animate-fade-in">
          {profile.avatar_url ? (
            <button
              type="button"
              onClick={() => setLightbox({ src: profile.avatar_url, alt: displayName })}
              className="focus:outline-none"
              title="Ver foto"
            >
              <img
                src={profile.avatar_url}
                alt={displayName}
                className="w-28 h-28 mx-auto mb-6 rounded-full border-4 border-white/40 shadow-2xl object-cover backdrop-blur-sm cursor-zoom-in hover:scale-105 transition-transform"
              />
            </button>
          ) : (
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/40 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
              {initial}
            </div>
          )}

          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            {displayName}
          </h1>

          {profile.bio && (
            <p className="text-white/90 text-lg max-w-md mx-auto leading-relaxed drop-shadow">
              {profile.bio}
            </p>
          )}

          {/* Ubicación */}
          {profile.address && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 mr-2 inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-sm font-medium text-white hover:bg-white/30 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.address}
              <span className="text-white/70 text-xs">· cómo llegar</span>
            </a>
          )}

          {/* Horarios: chip abierto/cerrado + detalle */}
          {hasHours(profile.hours) && (
            <details className="mt-4 inline-block text-left">
              <summary className="list-none cursor-pointer inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-sm font-medium text-white hover:bg-white/30 transition-colors">
                <span
                  className={`w-2 h-2 rounded-full ${isOpenNow(profile.hours) ? 'bg-green-400' : 'bg-red-400'}`}
                ></span>
                {isOpenNow(profile.hours) ? 'Abierto ahora' : 'Cerrado'}
                <span className="text-white/70 text-xs">· ver horarios</span>
              </summary>
              <div className="mt-2 px-4 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl text-sm text-white space-y-1">
                {DAY_KEYS.map((k) => {
                  const d = profile.hours?.[k];
                  const open = d && !d.closed && d.open && d.close;
                  return (
                    <div key={k} className="flex justify-between gap-6">
                      <span className="text-white/80">{DAY_NAMES[k]}</span>
                      <span className="font-medium">{open ? `${d.open} – ${d.close}` : 'Cerrado'}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>

        {/* Botón destacado de WhatsApp */}
        {profile.whatsapp && (
          <a
            href={`https://wa.me/${profile.whatsapp}?text=${encodeURIComponent(`¡Hola! Vengo de tu MiniBio (${displayName})`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full p-5 mb-6 bg-[#25D366] rounded-2xl text-white font-bold text-lg shadow-2xl hover:bg-[#1fbd5a] hover:scale-105 active:scale-95 transition-all duration-300 animate-slide-up"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </a>
        )}

        {/* Links */}
        <div className="space-y-4 mb-12">
          {links.length === 0 && menus.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-white/70 text-lg font-medium">
                No hay contenido disponible aún
              </p>
            </div>
          ) : (
            links.map((link, index) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className="block w-full p-5 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-white font-semibold text-lg text-center transition-all duration-300 hover:bg-white/30 hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-center gap-3">
                  <LinkIcon url={link.url} className="w-5 h-5 flex-shrink-0" />
                  <span>{link.title}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Menú digital agrupado por categoría */}
        {menus.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white text-center mb-6 drop-shadow-lg">
              Productos
            </h2>
            {(() => {
              // Agrupar por categoría manteniendo el orden; sin categoría al final
              const groups = [];
              const byCat = new Map();
              menus.forEach((item) => {
                const cat = item.category?.trim() || null;
                if (!byCat.has(cat)) {
                  byCat.set(cat, []);
                  groups.push(cat);
                }
                byCat.get(cat).push(item);
              });
              groups.sort((a, b) => (a === null) - (b === null));

              return groups.map((cat) => (
                <div key={cat ?? '_otros'} className="mb-6">
                  {cat && (
                    <h3 className="text-white/90 font-bold text-lg mb-3 pl-1 border-l-4 border-white/50 pl-3">
                      {cat}
                    </h3>
                  )}
                  <div className="space-y-4">
                    {byCat.get(cat).map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 animate-slide-up"
                  style={{ animationDelay: `${index * 0.08}s` }}
                >
                  {item.image && (
                    <button
                      type="button"
                      onClick={() => setLightbox({ src: item.image, alt: item.product_name || '' })}
                      className="flex-shrink-0 focus:outline-none"
                      title="Ver foto"
                    >
                      <img
                        src={item.image}
                        alt={item.product_name || ''}
                        className="w-20 h-20 rounded-xl object-cover border-2 border-white/30 cursor-zoom-in hover:scale-105 transition-transform"
                      />
                    </button>
                  )}
                  <div className="flex-1 min-w-0 text-left">
                    <h3 className="text-white font-bold text-lg truncate">
                      {item.product_name}
                    </h3>
                    {item.product_description && (
                      <p className="text-white/80 text-sm leading-snug">
                        {item.product_description}
                      </p>
                    )}
                  </div>
                  {formatPrice(item.price) && (
                    <span className="text-white font-bold text-lg whitespace-nowrap flex-shrink-0">
                      {formatPrice(item.price)}
                    </span>
                  )}
                </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}

        {/* Datos de pago */}
        {(profile.payment_alias || profile.payment_link) && (
          <div className="mb-8 p-5 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-center">
            <p className="text-white font-bold text-lg mb-3">💸 Formas de pago</p>
            {profile.payment_alias && (
              <button
                type="button"
                onClick={copyAlias}
                className="w-full mb-2 px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-mono text-sm hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
                title="Copiar alias"
              >
                <span className="truncate">{profile.payment_alias}</span>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            )}
            {aliasCopied && (
              <p className="text-green-300 text-sm font-medium mb-2">¡Alias copiado!</p>
            )}
            {profile.payment_link && (
              <a
                href={profile.payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full px-4 py-3 bg-[#009EE3] rounded-xl text-white font-semibold hover:bg-[#0089c4] transition-colors"
              >
                Pagar con MercadoPago
              </a>
            )}
          </div>
        )}

        {/* Reseñas de Google */}
        {profile.reviews_url && (
          <a
            href={profile.reviews_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-4 mb-8 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-white font-semibold text-center hover:bg-white/30 transition-all hover:scale-105"
          >
            ⭐ Dejanos tu reseña en Google
          </a>
        )}

        {/* QR y Compartir */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            type="button"
            onClick={handleShowQr}
            title="Ver código QR"
            className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all"
          >
            {/* Icono QR */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM20 14h1v1h-1zM14 20h1v1h-1zM18 18h3v3h-3z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleShare}
            title="Compartir"
            className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-2xl flex items-center justify-center text-white hover:bg-white/30 hover:scale-110 transition-all"
          >
            {/* Icono compartir (share-nodes) */}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="18" cy="5" r="2.5" />
              <circle cx="6" cy="12" r="2.5" />
              <circle cx="18" cy="19" r="2.5" />
              <line x1="8.2" y1="10.8" x2="15.8" y2="6.2" strokeLinecap="round" />
              <line x1="8.2" y1="13.2" x2="15.8" y2="17.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {shareMsg && (
          <p className="text-center text-white/90 text-sm font-medium mb-4 animate-fade-in">
            {shareMsg}
          </p>
        )}

        {/* Footer */}
        <div className="text-center">
          <a
            href="https://minibio.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full text-white font-semibold hover:bg-white/30 transition-all hover:scale-105"
          >
            <span>Creá tu MiniBio</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>

      {/* Modal QR */}
      {qrDataUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setQrDataUrl(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 flex flex-col items-center gap-4 shadow-2xl max-w-xs w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 text-center">{displayName}</h3>
            <img src={qrDataUrl} alt={`QR de ${displayName}`} className="w-64 h-64 rounded-xl" />
            <p className="text-xs text-gray-500 text-center">
              Escaneá el código para abrir este MiniBio
            </p>
            <div className="flex gap-2 w-full">
              <a
                href={qrDataUrl}
                download={`minibio-${profile?.slug || 'qr'}.png`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold text-center hover:bg-blue-700 transition-colors"
              >
                Descargar
              </a>
              <button
                type="button"
                onClick={() => setQrDataUrl(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox: foto ampliada */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <div className="max-w-3xl max-h-[85vh] flex flex-col items-center gap-3">
            <img
              src={lightbox.src}
              alt={lightbox.alt}
              className="max-w-full max-h-[75vh] rounded-2xl object-contain shadow-2xl"
            />
            {lightbox.alt && (
              <p className="text-white font-semibold text-lg drop-shadow">{lightbox.alt}</p>
            )}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="px-5 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-sm font-medium hover:bg-white/30"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-slide-up { opacity: 0; animation: slide-up 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}
