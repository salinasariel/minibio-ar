// Plantillas para crear páginas: precargan tema, bio y links de ejemplo
// (los links traen URLs placeholder que el usuario edita después).

export const TEMPLATES = {
  gastro: {
    name: 'Gastronomía',
    emoji: '🍕',
    desc: 'Carta, pedidos y ubicación',
    theme: { preset: 'sunset' },
    bio: 'Comé rico, pedí fácil.',
    links: [
      { title: 'Instagram', url: 'https://instagram.com/tu_usuario' },
      { title: 'Pedinos por WhatsApp', url: 'https://wa.me/5491100000000' },
      { title: 'Cómo llegar', url: 'https://maps.google.com/?q=tu+direccion' },
    ],
  },
  tienda: {
    name: 'Tienda',
    emoji: '🛍️',
    desc: 'Catálogo y ventas online',
    theme: { preset: 'ocean' },
    bio: 'Envíos a todo el país.',
    links: [
      { title: 'Instagram', url: 'https://instagram.com/tu_usuario' },
      { title: 'Catálogo en MercadoLibre', url: 'https://mercadolibre.com.ar' },
      { title: 'Consultas por WhatsApp', url: 'https://wa.me/5491100000000' },
    ],
  },
  servicios: {
    name: 'Servicios',
    emoji: '💼',
    desc: 'Profesionales y freelancers',
    theme: { preset: 'forest' },
    bio: 'Presupuestos sin cargo.',
    links: [
      { title: 'Pedí tu presupuesto', url: 'https://wa.me/5491100000000' },
      { title: 'Instagram', url: 'https://instagram.com/tu_usuario' },
      { title: 'LinkedIn', url: 'https://linkedin.com/in/tu-perfil' },
    ],
  },
  personal: {
    name: 'Personal',
    emoji: '✨',
    desc: 'Creadores y redes',
    theme: { preset: 'night' },
    bio: 'Todos mis links en un solo lugar.',
    links: [
      { title: 'Instagram', url: 'https://instagram.com/tu_usuario' },
      { title: 'TikTok', url: 'https://tiktok.com/@tu_usuario' },
      { title: 'YouTube', url: 'https://youtube.com/@tu_canal' },
    ],
  },
};
