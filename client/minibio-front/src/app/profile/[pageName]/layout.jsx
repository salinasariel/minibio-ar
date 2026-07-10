const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Metadata dinámica: título de la pestaña e ícono según la página del usuario
export async function generateMetadata({ params }) {
  const { pageName } = await params;

  try {
    const res = await fetch(
      `${API_URL}/public/page-by-slug/${encodeURIComponent(pageName)}`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) {
      return { title: 'Página no encontrada · MiniBio' };
    }

    const data = await res.json();
    const profile = data.profile || {};
    const displayName = profile.title || profile.display_name || profile.username || pageName;

    const metadata = {
      title: displayName,
      description: profile.bio || `${displayName} en MiniBio`,
      openGraph: {
        title: displayName,
        description: profile.bio || `${displayName} en MiniBio`,
        ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
      },
    };

    // Favicon: la imagen que el usuario subió a la página (si tiene)
    if (profile.avatar_url) {
      metadata.icons = {
        icon: profile.avatar_url,
        apple: profile.avatar_url,
      };
    }

    return metadata;
  } catch {
    return { title: 'MiniBio' };
  }
}

export default function PublicProfileLayout({ children }) {
  return children;
}
