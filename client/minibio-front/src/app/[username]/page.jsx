"use client";
import { useState, useEffect } from 'react';

export default function PublicProfilePage({ params }) {
  const { username } = params;
  
  const [profile, setProfile] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${API_URL}/public/${username}`);
        
        if (!res.ok) {
          throw new Error('Usuario no encontrado');
        }

        const data = await res.json();
        setProfile(data.profile);
        setLinks(data.links);
      } catch (error) {
        console.error(error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleLinkClick = async (linkId, url) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      await fetch(`${API_URL}/links/${linkId}/click`, {
        method: 'POST',
      });
    } catch (err) {
      console.error('Error tracking click:', err);
    }
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">404</h1>
          <p className="text-xl text-gray-400 mb-8">Usuario no encontrado</p>
          <a 
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Ir al inicio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Profile Section */}
        <div className="text-center mb-8 animate-fade-in">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="w-28 h-28 mx-auto mb-6 rounded-full border-4 border-white/40 shadow-2xl object-cover backdrop-blur-sm"
            />
          ) : (
            <div className="w-28 h-28 mx-auto mb-6 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/40 flex items-center justify-center text-5xl font-bold text-white shadow-2xl">
              {profile.username[0].toUpperCase()}
            </div>
          )}
          
          <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-lg">
            {profile.display_name || `@${profile.username}`}
          </h1>
          
          {profile.bio && (
            <p className="text-white/90 text-lg max-w-md mx-auto leading-relaxed drop-shadow">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4 mb-12">
          {links.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-white/70 text-lg font-medium">
                No hay links disponibles aún
              </p>
            </div>
          ) : (
            links.map((link, index) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className="block w-full p-5 bg-white/20 backdrop-blur-md rounded-2xl border-2 border-white/30 text-white font-semibold text-lg text-center transition-all duration-300 hover:bg-white/30 hover:scale-105 hover:shadow-2xl active:scale-95 cursor-pointer animate-slide-up"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
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

        {/* Footer */}
        <div className="text-center">
          <a
            href="https://minibio.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-full text-white font-semibold hover:bg-white/30 transition-all hover:scale-105"
          >
            <span>Creado con MiniBio</span>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-up {
          opacity: 0;
          animation: slide-up 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}