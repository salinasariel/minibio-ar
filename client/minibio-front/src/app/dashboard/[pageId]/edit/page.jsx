"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

export default function EditPage({ params }) {
  const { pageId } = params;
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [links, setLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchLinks = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/links/page/${pageId}`, token);
      setLinks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [token, pageId]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleAddLink = async () => {
    if (!newLinkTitle.trim() || !newLinkUrl.trim()) {
      setError('Por favor completa todos los campos');
      return;
    }

    setError('');

    try {
      const newLink = await apiFetch('/links', token, {
        method: 'POST',
        body: {
          page_id: parseInt(pageId),
          title: newLinkTitle,
          url: newLinkUrl,
        },
      });

      setLinks([...links, newLink]);
      setNewLinkTitle('');
      setNewLinkUrl('');
      showSuccess('✅ Link agregado');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('¿Estás seguro de eliminar este link?')) return;

    try {
      await apiFetch(`/links/${linkId}`, token, {
        method: 'DELETE',
      });

      setLinks(links.filter(link => link.id !== linkId));
      showSuccess('🗑️ Link eliminado');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStartEdit = (link) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditUrl('');
  };

  const handleSaveEdit = async (linkId) => {
    try {
      const updatedLink = await apiFetch(`/links/${linkId}`, token, {
        method: 'PUT',
        body: {
          title: editTitle,
          url: editUrl,
        },
      });

      setLinks(links.map(link => 
        link.id === linkId ? updatedLink : link
      ));

      setEditingId(null);
      showSuccess('✏️ Link actualizado');
    } catch (err) {
      setError(err.message);
    }
  };

  const copyPublicLink = () => {
    const publicUrl = `${window.location.origin}/${user.username}`;
    navigator.clipboard.writeText(publicUrl);
    showSuccess('📋 Link copiado!');
  };

  // Drag & Drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newLinks = [...links];
    const draggedItem = newLinks[draggedIndex];
    newLinks.splice(draggedIndex, 1);
    newLinks.splice(index, 0, draggedItem);

    setLinks(newLinks);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    if (draggedIndex === null) return;

    const reorderedLinks = links.map((link, index) => ({
      id: link.id,
      position: index,
    }));

    try {
      await apiFetch('/links/reorder', token, {
        method: 'PATCH',
        body: { links: reorderedLinks },
      });
      showSuccess('↕️ Links reordenados');
    } catch (err) {
      setError('Error al reordenar');
      fetchLinks();
    }

    setDraggedIndex(null);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
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
            <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <Button
              onClick={copyPublicLink}
              variant="glass"
              size="small"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              }
            >
              Copiar Link
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor de Links</h1>
          <p className="text-gray-600">
            minibio.ar/<span className="font-semibold text-blue-600">{user?.username}</span>
          </p>
        </div>

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

        {/* Formulario Agregar Link */}
        <Card variant="glass" padding="large" className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Añadir Nuevo Link</h2>
          <div className="space-y-4">
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Ej: Mi Instagram"
              label="Título"
            />
            <Input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://instagram.com/tuusuario"
              label="URL"
            />
            <Button onClick={handleAddLink} variant="primary" size="large" fullWidth>
              ➕ Añadir Link
            </Button>
          </div>
        </Card>

        {/* Lista de Links */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Links ({links.length})
          </h2>
          {links.length > 0 && (
            <p className="text-sm text-gray-500">
              Arrastra para reordenar ↕️
            </p>
          )}
        </div>

        {links.length === 0 ? (
          <Card variant="elevated" padding="large">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aún no tienes links
              </h3>
              <p className="text-gray-600">
                ¡Agrega tu primer link arriba!
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {links.map((link, index) => (
              <Card
                key={link.id}
                variant="glass"
                padding="none"
                className={`transition-all ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
              >
                <div
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="p-5 cursor-move"
                >
                  {editingId === link.id ? (
                    <div className="space-y-3">
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Título"
                      />
                      <Input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        placeholder="URL"
                      />
                      <div className="flex gap-2">
                        <Button onClick={() => handleSaveEdit(link.id)} variant="primary" size="small">
                          ✓ Guardar
                        </Button>
                        <Button onClick={handleCancelEdit} variant="secondary" size="small">
                          ✕ Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{link.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{link.url}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          👁️ {link.clicks} clicks
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleStartEdit(link)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
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