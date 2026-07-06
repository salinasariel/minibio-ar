"use client";
import { useState, useEffect, use } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';
import { THEMES, DEFAULT_THEME, randomGradient } from '@/lib/themes';
import { compressImage } from '@/lib/image';
import { DAY_KEYS, DAY_NAMES } from '@/lib/hours';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar';

export default function EditPage(props) {
  const { pageId } = use(props.params);
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [page, setPage] = useState(null);
  const [links, setLinks] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Links
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Página
  const [pageTitle, setPageTitle] = useState('');
  const [pageBio, setPageBio] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageTheme, setPageTheme] = useState(DEFAULT_THEME); // key de preset o 'custom'
  const [customFrom, setCustomFrom] = useState('#3b82f6');
  const [customTo, setCustomTo] = useState('#ec4899');
  const [pageAvatar, setPageAvatar] = useState(''); // data-URL o URL
  const [pageWhatsapp, setPageWhatsapp] = useState('');
  const [pageHours, setPageHours] = useState({}); // { mon: {closed, open, close}, ... }
  const [showHours, setShowHours] = useState(false);
  const [compressingAvatar, setCompressingAvatar] = useState(false);
  const [savingPage, setSavingPage] = useState(false);

  const handleAvatarFile = async (file) => {
    if (!file) return;
    setError('');
    setCompressingAvatar(true);
    try {
      // Avatar chico: 400px alcanza y pesa poco
      const dataUrl = await compressImage(file, 400, 0.75);
      setPageAvatar(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompressingAvatar(false);
    }
  };

  // Menú
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');
  const [menuPrice, setMenuPrice] = useState('');
  const [menuImage, setMenuImage] = useState(''); // data-URL comprimida
  const [menuCategory, setMenuCategory] = useState('');
  const [compressing, setCompressing] = useState(false);
  const [showMenuForm, setShowMenuForm] = useState(false);

  const handleImageFile = async (file) => {
    if (!file) return;
    setError('');
    setCompressing(true);
    try {
      const dataUrl = await compressImage(file); // máx 800px, JPEG ~72%
      setMenuImage(dataUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setCompressing(false);
    }
  };

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchPage = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/pages/${pageId}`, token);
      setPage(data);
      setLinks(data.links || []);
      setMenuItems(data.menus || []);
      setPageTitle(data.title || '');
      setPageBio(data.bio || '');
      setPageSlug(data.slug || '');
      setPageAvatar(data.avatar_url || '');
      setPageWhatsapp(data.whatsapp || '');
      setPageHours(data.hours || {});
      setShowHours(Boolean(data.hours));
      if (data.theme?.from && data.theme?.to) {
        setPageTheme('custom');
        setCustomFrom(data.theme.from);
        setCustomTo(data.theme.to);
      } else {
        setPageTheme(data.theme?.preset || DEFAULT_THEME);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [token, pageId]);

  const showSuccess = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(''), 3000);
  };

  const publicUrl = page ? `https://${page.slug}.${ROOT_DOMAIN}` : '';

  // ========================================
  // Página: guardar configuración
  // ========================================
  const handleSavePage = async () => {
    if (!pageTitle.trim()) {
      setError('El título no puede estar vacío');
      return;
    }
    setError('');
    setSavingPage(true);
    try {
      const updated = await apiFetch(`/pages/${pageId}`, token, {
        method: 'PUT',
        body: {
          title: pageTitle,
          bio: pageBio,
          slug: pageSlug || undefined,
          avatar_url: pageAvatar || '',
          whatsapp: pageWhatsapp || '',
          hours: showHours && Object.keys(pageHours).length > 0 ? pageHours : null,
          theme:
            pageTheme === 'custom'
              ? { from: customFrom, to: customTo }
              : { preset: pageTheme },
        },
      });
      setPage({ ...page, ...updated });
      setPageSlug(updated.slug);
      showSuccess('Página guardada');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPage(false);
    }
  };

  const copyPublicLink = () => {
    navigator.clipboard.writeText(publicUrl);
    showSuccess('¡Link copiado!');
  };

  // ========================================
  // Links
  // ========================================
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
      showSuccess('Link agregado');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteLink = async (linkId) => {
    if (!confirm('¿Estás seguro de eliminar este link?')) return;
    try {
      await apiFetch(`/links/${linkId}`, token, { method: 'DELETE' });
      setLinks(links.filter((link) => link.id !== linkId));
      showSuccess('Link eliminado');
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
        body: { title: editTitle, url: editUrl },
      });
      setLinks(links.map((link) => (link.id === linkId ? updatedLink : link)));
      setEditingId(null);
      showSuccess('Guardado');
    } catch (err) {
      setError(err.message);
    }
  };

  // Drag & Drop
  const handleDragStart = (index) => setDraggedIndex(index);

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
      showSuccess('Guardado');
    } catch (err) {
      setError('Error al reordenar');
      fetchPage();
    }
    setDraggedIndex(null);
  };

  // ========================================
  // Menú
  // ========================================
  const handleAddMenuItem = async () => {
    if (!menuName.trim()) {
      setError('El producto necesita un nombre');
      return;
    }
    setError('');
    try {
      const item = await apiFetch('/menus', token, {
        method: 'POST',
        body: {
          page_id: parseInt(pageId),
          product_name: menuName,
          product_description: menuDescription || null,
          category: menuCategory || null,
          price: menuPrice === '' ? null : parseFloat(menuPrice),
          image: menuImage || null,
        },
      });
      setMenuItems([...menuItems, item]);
      setMenuName('');
      setMenuDescription('');
      setMenuPrice('');
      setMenuImage('');
      setMenuCategory('');
      setShowMenuForm(false);
      showSuccess('Producto agregado al menú');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleMenuItem = async (item) => {
    try {
      const updated = await apiFetch(`/menus/${item.id}`, token, {
        method: 'PUT',
        body: { status: item.status === 'active' ? 'inactive' : 'active' },
      });
      setMenuItems(menuItems.map((m) => (m.id === item.id ? updated : m)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm('¿Eliminar este producto del menú?')) return;
    try {
      await apiFetch(`/menus/${itemId}`, token, { method: 'DELETE' });
      setMenuItems(menuItems.filter((m) => m.id !== itemId));
      showSuccess('Producto eliminado');
    } catch (err) {
      setError(err.message);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined) return null;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(Number(price));
  };

  if (loading || isLoading) {
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
            <Link href="/dashboard" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-xl transition-colors font-medium"
              >
                Ver página
              </a>
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
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor de página</h1>
          <p className="text-gray-600">
            <span className="font-semibold text-blue-600">{page?.slug}</span>.{ROOT_DOMAIN}
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

        {/* Configuración de la página */}
        <Card variant="glass" padding="large" className="mb-8 p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Configuración de la página</h2>
          <div className="text-gray-700 space-y-4">
            {/* Foto de perfil de la página */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Foto de perfil (opcional)
              </label>
              <div className="flex items-center gap-4">
                {pageAvatar ? (
                  <img
                    src={pageAvatar}
                    alt="Foto de perfil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shadow"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow">
                    {(pageTitle || '?').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <label className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm font-medium text-center">
                    {compressingAvatar ? 'Optimizando…' : pageAvatar ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleAvatarFile(e.target.files?.[0])}
                    />
                  </label>
                  {pageAvatar && (
                    <button
                      type="button"
                      onClick={() => setPageAvatar('')}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Input
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Mi Negocio"
              label="Título"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio / descripción</label>
              <textarea
                value={pageBio}
                onChange={(e) => setPageBio(e.target.value)}
                placeholder="Contale al mundo de qué se trata tu página"
                rows={2}
                maxLength={300}
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL pública (slug)</label>
              <div className="flex items-center gap-2">
                <input
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="mi-negocio"
                  className="flex-1 px-4 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-gray-500 text-sm whitespace-nowrap">.{ROOT_DOMAIN}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp para pedidos (opcional)
              </label>
              <input
                type="tel"
                value={pageWhatsapp}
                onChange={(e) => setPageWhatsapp(e.target.value)}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Si lo cargás, tu página muestra un botón verde "Pedinos por WhatsApp". Con código de país (54 para Argentina).
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">Horarios de atención (opcional)</label>
                <button
                  type="button"
                  onClick={() => setShowHours(!showHours)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    showHours ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {showHours ? 'Mostrando horarios' : 'Sin horarios'}
                </button>
              </div>
              {showHours && (
                <div className="space-y-2 bg-gray-50 border border-gray-200 rounded-xl p-3">
                  {DAY_KEYS.map((k) => {
                    const d = pageHours[k] || {};
                    const isOpen = !d.closed && (d.open || d.close);
                    const setDay = (patch) =>
                      setPageHours({ ...pageHours, [k]: { ...d, ...patch } });
                    return (
                      <div key={k} className="flex items-center gap-3 text-sm">
                        <label className="flex items-center gap-2 w-28 flex-shrink-0 text-gray-700">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={(e) =>
                              e.target.checked
                                ? setDay({ closed: false, open: d.open || '09:00', close: d.close || '18:00' })
                                : setDay({ closed: true })
                            }
                            className="rounded"
                          />
                          {DAY_NAMES[k]}
                        </label>
                        {isOpen ? (
                          <>
                            <input
                              type="time"
                              value={d.open || '09:00'}
                              onChange={(e) => setDay({ open: e.target.value })}
                              className="px-2 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg"
                            />
                            <span className="text-gray-400">a</span>
                            <input
                              type="time"
                              value={d.close || '18:00'}
                              onChange={(e) => setDay({ close: e.target.value })}
                              className="px-2 py-1 bg-white text-gray-900 border border-gray-200 rounded-lg"
                            />
                          </>
                        ) : (
                          <span className="text-gray-400">Cerrado</span>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-xs text-gray-400 pt-1">
                    Tu página muestra "Abierto ahora / Cerrado" automáticamente. Los horarios que cruzan medianoche (ej: 20:00 a 02:00) también funcionan.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <div className="flex gap-3 flex-wrap items-start">
                {Object.entries(THEMES).map(([key, t]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPageTheme(key)}
                    className="flex flex-col items-center gap-1 focus:outline-none"
                    title={t.name}
                  >
                    <span
                      className={`w-12 h-12 rounded-full border-4 transition-all ${
                        pageTheme === key ? 'border-blue-600 scale-110' : 'border-white'
                      }`}
                      style={{ background: t.swatch }}
                    ></span>
                    <span className="text-xs text-gray-600">{t.name}</span>
                  </button>
                ))}

                {/* Degradado personalizado */}
                <button
                  type="button"
                  onClick={() => setPageTheme('custom')}
                  className="flex flex-col items-center gap-1 focus:outline-none"
                  title="Personalizado"
                >
                  <span
                    className={`w-12 h-12 rounded-full border-4 transition-all ${
                      pageTheme === 'custom' ? 'border-blue-600 scale-110' : 'border-white'
                    }`}
                    style={{ background: `linear-gradient(135deg, ${customFrom}, ${customTo})` }}
                  ></span>
                  <span className="text-xs text-gray-600">Personalizado</span>
                </button>

                {/* Random */}
                <button
                  type="button"
                  onClick={() => {
                    const g = randomGradient();
                    setCustomFrom(g.from);
                    setCustomTo(g.to);
                    setPageTheme('custom');
                  }}
                  className="flex flex-col items-center gap-1 focus:outline-none"
                  title="Degradado aleatorio"
                >
                  <span className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center text-xl">
                    🎲
                  </span>
                  <span className="text-xs text-gray-600">Random</span>
                </button>
              </div>

              {pageTheme === 'custom' && (
                <div className="mt-3 flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    Color inicial
                    <input
                      type="color"
                      value={customFrom}
                      onChange={(e) => setCustomFrom(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                    />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    Color final
                    <input
                      type="color"
                      value={customTo}
                      onChange={(e) => setCustomTo(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer border border-gray-200"
                    />
                  </label>
                  <div
                    className="h-10 flex-1 min-w-32 rounded-xl border border-gray-200"
                    style={{ background: `linear-gradient(135deg, ${customFrom}, ${customTo})` }}
                    title="Vista previa"
                  ></div>
                </div>
              )}
            </div>
            <Button onClick={handleSavePage} variant="primary" fullWidth loading={savingPage}>
              Guardar cambios
            </Button>
          </div>
        </Card>

        {/* Formulario Agregar Link */}
        <Card variant="glass" padding="large" className="mb-8 p-5">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Añadir Nuevo Link</h2>
          <div className="text-gray-500 space-y-4">
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Instagram"
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
              Añadir
            </Button>
          </div>
        </Card>

        {/* Lista de Links */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Links ({links.length})</h2>
          {links.length > 0 && (
            <p className="text-sm text-gray-500">Arrastra para ordenar a gusto.</p>
          )}
        </div>

        {links.length === 0 ? (
          <Card variant="elevated" padding="large" className="mb-8">
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Nada por acá.</h3>
              <p className="text-gray-600">¡Agregá tu primer link arriba!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3 mb-8">
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
                    <div className="space-y-3 text-gray-500">
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
                          Guardar
                        </Button>
                        <Button onClick={handleCancelEdit} variant="secondary" size="small">
                          Cancelar
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
                        <p className="text-xs text-gray-400 mt-1">{link.clicks} clicks</p>
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

        {/* Menú digital */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Menú digital ({menuItems.length})</h2>
          {!showMenuForm && (
            <Button onClick={() => setShowMenuForm(true)} variant="primary" size="small">
              + Agregar producto
            </Button>
          )}
        </div>

        {showMenuForm && (
          <Card variant="glass" padding="large" className="mb-6 p-5 animate-scale-in">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo producto</h3>
            <div className="text-gray-700 space-y-4">
              <Input
                value={menuName}
                onChange={(e) => setMenuName(e.target.value)}
                placeholder="Café con leche"
                label="Nombre"
              />
              <Input
                value={menuDescription}
                onChange={(e) => setMenuDescription(e.target.value)}
                placeholder="Con leche de avena opcional"
                label="Descripción (opcional)"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría (opcional)
                </label>
                <input
                  list="menu-categories"
                  value={menuCategory}
                  onChange={(e) => setMenuCategory(e.target.value)}
                  placeholder="Ej: Cafés, Promos, Postres"
                  maxLength={40}
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <datalist id="menu-categories">
                  {[...new Set(menuItems.map((m) => m.category).filter(Boolean))].map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <p className="text-xs text-gray-400 mt-1">
                  Los productos se agrupan por categoría en tu página pública.
                </p>
              </div>
              <Input
                type="number"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="2500"
                label="Precio en ARS (opcional)"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto del producto (opcional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors text-sm font-medium">
                    {compressing ? 'Optimizando…' : menuImage ? 'Cambiar foto' : 'Subir foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageFile(e.target.files?.[0])}
                    />
                  </label>
                  {menuImage && (
                    <>
                      <img
                        src={menuImage}
                        alt="Vista previa"
                        className="w-16 h-16 rounded-xl object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => setMenuImage('')}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Quitar
                      </button>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Se comprime automáticamente para que tu página cargue rápido.
                </p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleAddMenuItem} variant="primary" fullWidth>
                  Agregar
                </Button>
                <Button onClick={() => setShowMenuForm(false)} variant="secondary">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {menuItems.length === 0 && !showMenuForm ? (
          <Card variant="elevated" padding="large">
            <div className="text-center py-8">
              <p className="text-gray-600">
                ¿Vendés productos o tenés un menú? Agregalos y se muestran en tu página pública.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {menuItems.map((item) => (
              <Card key={item.id} variant="glass" padding="none">
                <div className="p-5 flex items-center gap-4">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.product_name || ''}
                      className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-lg font-semibold truncate ${item.status === 'active' ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                      {item.product_name}
                    </h3>
                    {item.product_description && (
                      <p className="text-sm text-gray-500 truncate">{item.product_description}</p>
                    )}
                    {item.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                        {item.category}
                      </span>
                    )}
                    {formatPrice(item.price) && (
                      <p className="text-sm font-semibold text-gray-700 mt-1">{formatPrice(item.price)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0 items-center">
                    <button
                      onClick={() => handleToggleMenuItem(item)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {item.status === 'active' ? 'Visible' : 'Oculto'}
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
