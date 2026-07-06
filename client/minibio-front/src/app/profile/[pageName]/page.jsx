"use client";
import { useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import { getThemeView } from '@/lib/themes';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function PublicProfilePage() {
  const { pageName } = useParams(); // slug de la página

  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightbox, setLightbox] = useState(null); // { src, alt } | null

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
  const displayName = profile?.display_name || profile?.title || profile?.username || '';
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
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="w-28 h-28 mx-auto mb-6 rounded-full border-4 border-white/40 shadow-2xl object-cover backdrop-blur-sm"
            />
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
        </div>

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
                  <span>{link.title}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Menú digital */}
        {menus.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white text-center mb-6 drop-shadow-lg">
              Menú
            </h2>
            <div className="space-y-4">
              {menus.map((item, index) => (
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
