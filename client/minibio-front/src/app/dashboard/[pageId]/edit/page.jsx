"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function EditPage({ params }) {
  const { pageId } = params;
  const { user, token, loading } = useAuth();
  const router = useRouter();

  const [links, setLinks] = useState([]);
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const fetchLinks = async () => {
    if (!token) return;
    try {

      console.warn("Simulación de links. Debes crear el endpoint GET /api/links/page/:pageId en tu backend.");
      setLinks([
        {id: 1, title: 'Mi Twitter (Simulado)', url: 'https://twitter.com'},
        {id: 2, title: 'Mi GitHub (Simulado)', url: 'https://github.com'},
      ]);

    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [token]);

  const handleAddLink = async (e) => {
    e.preventDefault();
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
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Link href="/dashboard" className="text-indigo-600 hover:underline mb-4 inline-block">
        &larr; Volver a Mis Páginas
      </Link>
      <h1 className="text-3xl font-bold mb-6">Editor de Links</h1>

      <Card className="mb-8">
        <form onSubmit={handleAddLink}>
          <div className="p-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Añadir Nuevo Link</h2>
          </div>
          <div className="p-5 space-y-4">
            <Input
              value={newLinkTitle}
              onChange={(e) => setNewLinkTitle(e.target.value)}
              placeholder="Título (ej. 'Mi Instagram')"
              required
            />
            <Input
              type="url"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL (ej. 'https://instagram.com/...')"
              required
            />
            <Button type="submit" fullWidth>
              Añadir Link
            </Button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </form>
      </Card>

      <h2 className="text-2xl font-semibold mb-4">Links Actuales</h2>
      <div className="space-y-4">
        {links.map((link) => (
          <Card key={link.id} className="p-5 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">{link.title}</h3>
              <p className="text-sm text-gray-500 truncate max-w-xs">{link.url}</p>
            </div>
            <button className="text-sm text-red-500 hover:text-red-700">
              Eliminar
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}