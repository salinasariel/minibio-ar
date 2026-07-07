"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import Button from '@/components/Button';
import Card from '@/components/Card';
import Input from '@/components/Input';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar';

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Páginas expandidas por usuario: { [userId]: pages[] }
  const [expandedPages, setExpandedPages] = useState({});

  // Planes
  const [plans, setPlans] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [showPlans, setShowPlans] = useState(false);
  const [savingPlan, setSavingPlan] = useState(null);

  const fetchPlans = async () => {
    try {
      const data = await apiFetch('/admin/plans', token);
      setPlans(data.plans);
      setCatalog(data.catalog);
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePlanFeature = (planId, key) => {
    setPlans(plans.map((p) => {
      if (p.id !== planId) return p;
      const features = Array.isArray(p.features) ? p.features : [];
      return {
        ...p,
        features: features.includes(key) ? features.filter((f) => f !== key) : [...features, key],
      };
    }));
  };

  const setPlanLimit = (planId, field, value) => {
    setPlans(plans.map((p) => (p.id === planId ? { ...p, [field]: value } : p)));
  };

  const savePlan = async (p) => {
    setSavingPlan(p.id);
    try {
      const updated = await apiFetch(`/admin/plans/${p.id}`, token, {
        method: 'PUT',
        body: {
          name: p.name,
          features: Array.isArray(p.features) ? p.features : [],
          max_pages: parseInt(p.max_pages, 10),
          max_links: parseInt(p.max_links, 10),
        },
      });
      setPlans(plans.map((x) => (x.id === p.id ? updated : x)));
      showSuccess(`Plan "${updated.name}" guardado`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPlan(null);
    }
  };

  const changeUserPlan = async (u, planId) => {
    try {
      const updated = await apiFetch(`/admin/users/${u.id}`, token, {
        method: 'PUT',
        body: { plan_id: planId === '' ? null : parseInt(planId, 10) },
      });
      setUsers(users.map((x) => (x.id === u.id ? updated : x)));
      showSuccess('Plan actualizado');
    } catch (err) {
      setError(err.message);
    }
  };

  // Alta de usuario
  const [showCreate, setShowCreate] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.is_admin)) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const showSuccess = (m) => {
    setSuccess(m);
    setTimeout(() => setSuccess(''), 3000);
  };

  const fetchUsers = async (q = '') => {
    if (!token) return;
    setIsLoading(true);
    try {
      const data = await apiFetch(`/admin/users${q ? `?search=${encodeURIComponent(q)}` : ''}`, token);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers();
      fetchPlans();
    }
  }, [token, user]);

  // Búsqueda con debounce simple
  useEffect(() => {
    const t = setTimeout(() => {
      if (user?.is_admin) fetchUsers(search);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleFlag = async (u, field) => {
    try {
      const updated = await apiFetch(`/admin/users/${u.id}`, token, {
        method: 'PUT',
        body: { [field]: !u[field] },
      });
      setUsers(users.map((x) => (x.id === u.id ? updated : x)));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (u) => {
    if (!confirm(`¿Borrar al usuario "${u.username}" (${u.email})?\nSe borran también sus ${u._count.pages} página(s). Esto no se puede deshacer.`)) return;
    try {
      await apiFetch(`/admin/users/${u.id}`, token, { method: 'DELETE' });
      setUsers(users.filter((x) => x.id !== u.id));
      showSuccess('Usuario eliminado');
    } catch (err) {
      setError(err.message);
    }
  };

  const togglePages = async (u) => {
    if (expandedPages[u.id]) {
      const copy = { ...expandedPages };
      delete copy[u.id];
      setExpandedPages(copy);
      return;
    }
    try {
      const pages = await apiFetch(`/admin/users/${u.id}/pages`, token);
      setExpandedPages({ ...expandedPages, [u.id]: pages });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeletePage = async (userId, page) => {
    if (!confirm(`¿Borrar la página "${page.title}" (${page.slug})?`)) return;
    try {
      await apiFetch(`/admin/pages/${page.id}`, token, { method: 'DELETE' });
      setExpandedPages({
        ...expandedPages,
        [userId]: expandedPages[userId].filter((p) => p.id !== page.id),
      });
      setUsers(users.map((u) => (u.id === userId ? { ...u, _count: { pages: u._count.pages - 1 } } : u)));
      showSuccess('Página eliminada');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreateUser = async () => {
    setError('');
    setCreating(true);
    try {
      await apiFetch('/admin/users', token, {
        method: 'POST',
        body: { email: newEmail, username: newUsername, password: newPassword },
      });
      setShowCreate(false);
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      showSuccess('Usuario creado');
      fetchUsers(search);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading || !user?.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafaf8]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <Link href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Administración</h1>
          <Button onClick={() => setShowCreate(true)} variant="primary" size="small">
            + Usuario
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-800 font-medium">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
            <p className="text-sm text-green-800 font-medium">{success}</p>
          </div>
        )}

        {/* Planes */}
        <Card className="border border-gray-200 mb-6">
          <button
            onClick={() => setShowPlans(!showPlans)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-bold text-gray-900">Planes</h2>
              <p className="text-sm text-gray-500">
                {plans.map((p) => `${p.name} (${p._count?.users ?? 0})`).join(' · ') || 'Cargando…'}
              </p>
            </div>
            <span className="text-gray-400 text-sm">{showPlans ? 'Ocultar' : 'Editar'}</span>
          </button>

          {showPlans && (
            <div className="border-t border-gray-100 p-4 grid md:grid-cols-2 gap-4">
              {plans.map((p) => (
                <div key={p.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      value={p.name}
                      onChange={(e) => setPlanLimit(p.id, 'name', e.target.value)}
                      className="font-bold text-gray-900 bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-blue-500 w-32"
                    />
                    <span className="text-xs text-gray-400">
                      {p.code}{p.is_default ? ' · default' : ''} · {p._count?.users ?? 0} usuario{(p._count?.users ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {catalog.map((f) => {
                      const active = Array.isArray(p.features) && p.features.includes(f.key);
                      return (
                        <label key={f.key} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => togglePlanFeature(p.id, f.key)}
                            className="rounded"
                          />
                          {f.name}
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-700">
                    <label className="flex items-center gap-1.5">
                      Páginas
                      <input
                        type="number"
                        min={1}
                        value={p.max_pages}
                        onChange={(e) => setPlanLimit(p.id, 'max_pages', e.target.value)}
                        className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      />
                    </label>
                    <label className="flex items-center gap-1.5">
                      Links/pág.
                      <input
                        type="number"
                        min={1}
                        value={p.max_links}
                        onChange={(e) => setPlanLimit(p.id, 'max_links', e.target.value)}
                        className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-gray-900"
                      />
                    </label>
                  </div>

                  <Button onClick={() => savePlan(p)} variant="primary" size="small" loading={savingPlan === p.id}>
                    Guardar plan
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Búsqueda */}
        <div className="mb-6">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email, username o nombre…"
          />
        </div>

        {/* Lista de usuarios */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">Sin resultados</Card>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">{users.length} usuario{users.length !== 1 ? 's' : ''}</p>
            {users.map((u) => (
              <Card key={u.id} className="border border-gray-200">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{u.username}</span>
                        {u.is_admin && (
                          <span className="px-2 py-0.5 bg-gray-900 text-white rounded-full text-[10px] font-semibold">admin</span>
                        )}
                        {u.ai_enabled && (
                          <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-[10px] font-semibold">IA</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${u.email_verified ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                          {u.email_verified ? 'verificado' : 'sin verificar'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">{u.email}</p>
                      <p className="text-xs text-gray-400">
                        {u._count.pages} página{u._count.pages !== 1 ? 's' : ''} · alta {new Date(u.created_at).toLocaleDateString('es-AR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap">
                      <select
                        value={u.plan?.id ?? ''}
                        onChange={(e) => changeUserPlan(u, e.target.value)}
                        className="px-2 py-1.5 text-xs font-medium bg-gray-50 border border-gray-200 rounded-lg text-gray-700"
                        title="Plan del usuario"
                      >
                        <option value="">(default)</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => togglePages(u)}
                        className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        {expandedPages[u.id] ? 'Ocultar páginas' : 'Ver páginas'}
                      </button>
                      <button
                        onClick={() => toggleFlag(u, 'email_verified')}
                        className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                        title="Alternar verificación de email"
                      >
                        {u.email_verified ? 'Quitar verif.' : 'Verificar'}
                      </button>
                      <button
                        onClick={() => toggleFlag(u, 'ai_enabled')}
                        className="px-2.5 py-1.5 text-xs font-medium text-violet-600 hover:bg-violet-50 rounded-lg"
                        title="Alternar asistente IA"
                      >
                        {u.ai_enabled ? 'Quitar IA' : 'Dar IA'}
                      </button>
                      {!u.is_admin && (
                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          Borrar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Páginas del usuario */}
                  {expandedPages[u.id] && (
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      {expandedPages[u.id].length === 0 ? (
                        <p className="text-sm text-gray-400">Sin páginas</p>
                      ) : (
                        <div className="space-y-2">
                          {expandedPages[u.id].map((p) => (
                            <div key={p.id} className="flex items-center justify-between gap-3 text-sm">
                              <div className="min-w-0">
                                <span className="font-medium text-gray-800">{p.title}</span>{' '}
                                <a
                                  href={`https://${p.slug}.${ROOT_DOMAIN}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  {p.slug}.{ROOT_DOMAIN}
                                </a>
                                <span className="text-gray-400 text-xs">
                                  {' '}· {p._count.links} links · {p._count.menus} productos
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeletePage(u.id, p)}
                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg flex-shrink-0"
                              >
                                Borrar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal alta de usuario */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => !creating && setShowCreate(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Nuevo usuario</h3>
            <p className="text-sm text-gray-500 mb-4">Se crea con el email ya verificado.</p>
            <div className="space-y-3">
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@ejemplo.com" label="Email" type="email" />
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="usuario" label="Username" />
              <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mín. 8, mayúscula, número y símbolo" label="Contraseña" type="password" />
              <div className="flex gap-2 pt-1">
                <Button onClick={handleCreateUser} variant="primary" fullWidth loading={creating}>
                  Crear
                </Button>
                <Button onClick={() => setShowCreate(false)} variant="secondary" disabled={creating}>
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
