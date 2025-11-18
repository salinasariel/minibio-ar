"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api'; 
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, token, loading, logout } = useAuth();
  const router = useRouter();

  const [pages, setPages] = useState([]); 
  const [newPageTitle, setNewPageTitle] = useState('');
  const [error, setError] = useState('');
  const [isLoadingPages, setIsLoadingPages] = useState(true);

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

  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newPageTitle) return;

    try {
      const newPage = await apiFetch('/pages/create', token, {
        method: 'POST',
        body: { title: newPageTitle, bio: '' }, 
      });
      setPages([...pages, newPage]);
      setNewPageTitle('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-sky-50 ">Cargando...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 bg-sky-200">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          ¡Hola, {user.username}!
        </h1>
        <button
          onClick={logout}
          className="text-sm text-gray-600 hover:text-indigo-600"
        >
          Cerrar Sesión
        </button>
      </div>

      <Card className="mb-8">
        <form onSubmit={handleCreatePage} className="p-5">
          <h2 className="text-xl font-semibold mb-4">Crear nueva página</h2>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex gap-4">
            <Input
              value={newPageTitle}
              onChange={(e) => setNewPageTitle(e.target.value)}
              placeholder="Nombre de tu nueva página (ej. 'Negocio')"
              required
            />
            <Button type="submit">Crear</Button>
          </div>
        </form>
      </Card>

      <h2 className="text-2xl font-semibold mb-4">Tus Páginas</h2>
      <div className="space-y-4">
        {isLoadingPages && <p>Cargando páginas...</p>}
        {pages.length === 0 && !isLoadingPages && (
          <p className="text-gray-500">Aún no has creado ninguna página.</p>
        )}
        
        {pages.map((page) => (
          <Card key={page.id} className="p-5 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{page.title}</h3>
              <p className="text-sm text-gray-500">{page.bio || 'Sin biografía'}</p>
            </div>
            <Link
              href={`/dashboard/${page.id}/edit`}
              className="py-2 px-4 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200"
            >
              Editar Links
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}