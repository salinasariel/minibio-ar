const prisma = require('../models/db');

// Convierte un texto libre en slug: "Mi Café ñoño" -> "mi-cafe-nono"
function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // sacar acentos
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'pagina';
}

// Devuelve un slug único, agregando sufijo numérico si hace falta
async function uniqueSlug(base, excludePageId = null) {
  let candidate = slugify(base);
  let i = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.page.findUnique({ where: { slug: candidate } });
    if (!existing || existing.id === excludePageId) return candidate;
    i += 1;
    candidate = `${slugify(base).slice(0, 45)}-${i}`;
  }
}

module.exports = { slugify, uniqueSlug };
