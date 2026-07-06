const prisma = require('../models/db');
const { aiResponseSchema } = require('../lib/aiSchema');

// Modelos a intentar en orden (los nombres de Google rotan seguido)
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
].filter(Boolean);
const DAILY_LIMIT = 15;

// Rate limit en memoria: userId -> { day, count }
const usage = new Map();

const checkQuota = (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const u = usage.get(userId);
  if (!u || u.day !== today) {
    usage.set(userId, { day: today, count: 1 });
    return true;
  }
  if (u.count >= DAILY_LIMIT) return false;
  u.count += 1;
  return true;
};

const SYSTEM_PROMPT = `Sos el asistente de MiniBio.ar, una app argentina de páginas link-in-bio para negocios y emprendedores.
El usuario describe qué quiere para su página y vos devolvés SOLO un JSON (sin markdown, sin explicaciones) con esta forma exacta:

{
  "notes": "string opcional: aclaraciones breves para el usuario",
  "page": {
    "title": "string <= 60",
    "bio": "string <= 300",
    "theme": {
      "preset": "ocean|sunset|forest|night (usar SOLO si no se piden colores custom)",
      "from": "#rrggbb", "to": "#rrggbb", "direction": "br|b|r|tr",
      "font": "sans|serif|mono",
      "button": { "variant": "glass|solid|outline", "radius": "full|2xl|lg", "color": "#rrggbb" }
    },
    "whatsapp": "solo dígitos con código de país, ej 5491112345678",
    "address": "string <= 120",
    "hours": { "mon": {"open":"09:00","close":"18:00"}, "sun": {"closed":true}, ... },
    "links": [ { "title": "string <= 80", "url": "https://..." } ],
    "products": [ { "product_name": "string <= 80", "product_description": "string <= 300", "category": "string <= 40", "price": numero } ]
  }
}

REGLAS ESTRICTAS:
1. Todos los campos de "page" son opcionales: incluí SOLO los que el pedido justifica cambiar o crear. No repitas datos existentes sin cambios.
2. "links" y "products" son SOLO elementos NUEVOS para agregar. Nunca repitas los existentes.
3. URLs: si el usuario no dio la URL real, usá placeholders obvios (https://instagram.com/tu_usuario, https://wa.me/5491100000000). NUNCA inventes URLs que parezcan reales.
4. MiniBio SOLO tiene estas funciones: links, productos con foto/precio/categoría, WhatsApp, dirección con Google Maps, horarios, datos de pago, reseñas de Google, QR, temas de color. Si piden algo que NO existe (reservas online, carrito, pagos integrados, videos, dominio propio, etc.), NO lo inventes: explicá en "notes" que todavía no está disponible y ofrecé la alternativa más cercana (ej: reservas → link de WhatsApp).
5. Estilo: usá los tokens de "theme". Elegí colores que combinen y con buen contraste con texto blanco. No hay más opciones de estilo que esas.
6. Contenido: español argentino, natural, sin exagerar. Rechazá pedidos de contenido ilegal, adulto o engañoso devolviendo notes con la negativa y page vacío {}.
7. Respondé SOLO el JSON válido.`;

// ========================================
// POST /api/ai/page  { prompt, current? }
// Devuelve una propuesta validada; NO modifica nada.
// ========================================
exports.generatePage = async (req, res) => {
  const userId = req.user.userId;
  const { prompt, current } = req.body || {};

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5 || prompt.length > 600) {
    return res.status(400).json({ error: 'Contanos qué querés (entre 5 y 600 caracteres)' });
  }

  try {
    // Flag por usuario: solo cuentas con IA habilitada
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { ai_enabled: true },
    });
    if (!user?.ai_enabled) {
      return res.status(403).json({ error: 'El asistente IA no está habilitado para tu cuenta' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'El asistente IA no está configurado' });
    }

    if (!checkQuota(userId)) {
      return res.status(429).json({ error: `Alcanzaste el límite de ${DAILY_LIMIT} usos por día` });
    }

    // Contexto: estado actual de la página (opcional, para modificaciones)
    const context = current
      ? `\n\nESTADO ACTUAL DE LA PÁGINA (para que sepas qué existe; no repitas lo que no cambia):\n${JSON.stringify(current).slice(0, 4000)}`
      : '';

    const payload = JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: `${prompt.trim()}${context}` }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    // Intentar cada modelo hasta que uno responda
    let geminiRes = null;
    let lastStatus = null;
    for (const model of GEMINI_MODELS) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload }
      );
      if (r.ok) {
        geminiRes = r;
        break;
      }
      lastStatus = r.status;
      const detail = await r.text().catch(() => '');
      console.error(`Gemini error (${model}):`, r.status, detail.slice(0, 300));
      // 401/403 = problema de key: no tiene sentido probar otros modelos
      if (r.status === 401 || r.status === 403) break;
    }

    if (!geminiRes) {
      const hint =
        lastStatus === 401 || lastStatus === 403
          ? 'la API key parece inválida o sin permisos'
          : lastStatus === 429
            ? 'se agotó la cuota gratuita del día'
            : `HTTP ${lastStatus}`;
      return res.status(502).json({ error: `El asistente no respondió (${hint})` });
    }

    const data = await geminiRes.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return res.status(502).json({ error: 'El asistente no devolvió una propuesta' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'La propuesta vino en un formato inválido, probá de nuevo' });
    }

    // Validación estricta: lo que no cumple el schema, no pasa
    const result = aiResponseSchema.safeParse(parsed);
    if (!result.success) {
      console.error('AI schema mismatch:', result.error.issues.slice(0, 3));
      return res.status(502).json({ error: 'La propuesta no cumplió las reglas, probá reformular el pedido' });
    }

    res.status(200).json({ proposal: result.data });
  } catch (error) {
    console.error('generatePage error:', error);
    res.status(500).json({ error: 'Error del asistente IA' });
  }
};
