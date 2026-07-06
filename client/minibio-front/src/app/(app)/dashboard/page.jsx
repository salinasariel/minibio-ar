"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Link from 'next/link';
import { TEMPLATES } from '@/lib/templates';

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [pages, setPages] = useState([]);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingPages, setIsLoadingPages] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null); // key de TEMPLATES o null
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPages = async () => {
    if (!token) return;
    try {
      setIsLoadingPages(true);
      const data = await apiFetch('/pages', token);
      setPages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoadingPages(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [token]);

  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) {
      setError('Por favor ingresa un nombre para la página');
      return;
    }

    setCreating(true);
    try {
      const template = selectedTemplate ? TEMPLATES[selectedTemplate] : null;

      const newPage = await apiFetch('/pages/create', token, {
        method: 'POST',
        body: {
          title: newPageTitle,
          bio: template?.bio || '',
          theme: template?.theme || null,
        },
      });

      // Plantilla: crear los links de ejemplo
      if (template) {
        for (const link of template.links) {
          await apiFetch('/links', token, {
            method: 'POST',
            body: { page_id: newPage.id, title: link.title, url: link.url },
          });
        }
        // Llevar directo al editor para que personalice los placeholders
        router.push(`/dashboard/${newPage.id}/edit`);
        return;
      }

      setPages([newPage, ...pages]);
      setNewPageTitle('');
      setSelectedTemplate(null);
      setShowCreateForm(false);
      setSuccess('¡Página creada exitosamente!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user.username[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  ¡Hola, {user.username}!
                </h1>
                <p className="text-sm text-gray-500">Gestiona tus páginas</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
            <Link
              href="/dashboard/stats"
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Estadísticas
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Salir
            </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        {/* Mensajes */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Create Page Section */}
        <div className="mb-8">
          {!showCreateForm ? (
            <Card variant="glass" padding="medium" hover>
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-3 py-4 text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear nueva página
              </button>
            </Card>
          ) : (
            <Card variant="glass" padding="large" className="mb-6 p-4 animate-scale-in">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Nueva Página</h2>
              <div className="space-y-4">
                <Input
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Ej: Mi Negocio, Portfolio, etc."
                  label="Nombre de la página"
                  required
                />

                {/* Plantillas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Arrancá con una plantilla (opcional)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {Object.entries(TEMPLATES).map(([key, t]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedTemplate(selectedTemplate === key ? null : key)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          selectedTemplate === key
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <span className="text-2xl">{t.emoji}</span>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{t.name}</p>
                        <p className="text-xs text-gray-500">{t.desc}</p>
                      </button>
                    ))}
                  </div>
                  {selectedTemplate && (
                    <p className="text-xs text-gray-500 mt-2">
                      Se crean links de ejemplo y un tema acorde. Después los editás con tus datos.
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleCreatePage} variant="primary" fullWidth loading={creating}>
                    Crear Página
                  </Button>
                  <Button
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPageTitle('');
                      setError('');
                    }}
                    variant="secondary"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Pages List */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Tus Páginas ({pages.length})
          </h2>
        </div>

        {isLoadingPages ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : pages.length === 0 ? (
          <Card variant="elevated" padding="large">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aún no tienes páginas
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera página para empezar a compartir tus links
              </p>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="primary"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
              >
                Crear Primera Página
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4">
            {pages.map((page, index) => (
              <Card
                key={page.id}
                variant="glass"
                padding="none"
                hover
                className="overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {page.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-1">
                        {page.bio || 'Sin descripción'}
                      </p>
                      {page.slug && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`https://${page.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar'}`);
                            setSuccess('¡Link copiado!');
                            setTimeout(() => setSuccess(''), 2000);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline mb-3 block"
                          title="Copiar link público"
                        >
                          {page.slug}.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar'} ⧉
                        </button>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          {page.links?.length || 0} links
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {page.links?.reduce((sum, link) => sum + (link.clicks || 0), 0) || 0} visitas
                        </span>
                      </div>
                    </div>
                    <Link href={`/dashboard/${page.id}/edit`}>
                      <Button variant="primary" size="medium">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}