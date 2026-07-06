const { z } = require('zod');

// ========================================
// Schemas
// ========================================
const urlSchema = z
  .string()
  .trim()
  .max(2048)
  .url('URL inválida')
  .refine((u) => /^https?:\/\//i.test(u), 'La URL debe empezar con http:// o https://');

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'El slug debe tener al menos 3 caracteres')
  .max(50, 'El slug no puede superar 50 caracteres')
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Solo minúsculas, números y guiones');

const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72)
  .refine((p) => /[A-Z]/.test(p), 'Debe incluir al menos una mayúscula')
  .refine((p) => /[a-z]/.test(p), 'Debe incluir al menos una minúscula')
  .refine((p) => /[0-9]/.test(p), 'Debe incluir al menos un número')
  .refine((p) => /[^A-Za-z0-9]/.test(p), 'Debe incluir al menos un carácter especial');

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(254),
  password: passwordSchema,
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-z0-9_-]+$/, 'Username: solo letras, números, guiones y guión bajo'),
  display_name: z.string().trim().max(60).optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: passwordSchema,
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// Imagen: URL http(s) o data-URL base64 comprimida (máx ~1.5MB)
const imageSchema = z
  .string()
  .max(1_500_000, 'La imagen es demasiado grande')
  .refine(
    (v) => /^https?:\/\//i.test(v) || /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v),
    'Imagen inválida'
  );

// WhatsApp: acepta cualquier formato, guarda solo dígitos (8-15) o vacío
const whatsappSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || (v.length >= 8 && v.length <= 15), 'Número de WhatsApp inválido');

// Horarios: { mon: { closed, open: "HH:MM", close: "HH:MM" }, ... }
const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dayHoursSchema = z
  .object({
    closed: z.boolean().optional(),
    open: z.string().regex(timeRegex, 'Hora inválida').optional(),
    close: z.string().regex(timeRegex, 'Hora inválida').optional(),
  })
  .optional();

const hoursSchema = z
  .object({
    mon: dayHoursSchema,
    tue: dayHoursSchema,
    wed: dayHoursSchema,
    thu: dayHoursSchema,
    fri: dayHoursSchema,
    sat: dayHoursSchema,
    sun: dayHoursSchema,
  })
  .nullable();

// Link de pago: solo dominios de MercadoPago (evita links disfrazados)
const paymentLinkSchema = z
  .string()
  .trim()
  .max(300)
  .url('Link inválido')
  .refine((u) => {
    try {
      const host = new URL(u).hostname.toLowerCase();
      return host === 'mpago.la' || host.endsWith('.mercadopago.com.ar') || host.endsWith('.mercadopago.com') || host === 'mercadopago.com.ar' || host === 'mercadopago.com';
    } catch {
      return false;
    }
  }, 'Debe ser un link de MercadoPago (mpago.la o mercadopago.com)');

// Link de reseñas: solo dominios de Google
const reviewsUrlSchema = z
  .string()
  .trim()
  .max(300)
  .url('Link inválido')
  .refine((u) => {
    try {
      const host = new URL(u).hostname.toLowerCase();
      return (
        host === 'g.page' ||
        host === 'maps.app.goo.gl' ||
        host === 'goo.gl' ||
        host.endsWith('.google.com') ||
        host === 'google.com' ||
        host.endsWith('.google.com.ar') ||
        host === 'google.com.ar'
      );
    } catch {
      return false;
    }
  }, 'Debe ser un link de Google (g.page, maps.app.goo.gl o google.com)');

const pageCreateSchema = z.object({
  title: z.string().trim().min(1, 'Título requerido').max(60),
  bio: z.string().trim().max(300).optional().default(''),
  avatar_url: imageSchema.optional().nullable().or(z.literal('')),
  whatsapp: whatsappSchema.optional(),
  address: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  payment_alias: z.string().trim().max(60).optional().nullable().or(z.literal('')),
  payment_link: paymentLinkSchema.optional().nullable().or(z.literal('')),
  reviews_url: reviewsUrlSchema.optional().nullable().or(z.literal('')),
  hours: hoursSchema.optional(),
  theme: z.record(z.any()).nullable().optional(),
  slug: slugSchema.optional(),
});

const pageUpdateSchema = z.object({
  title: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(300).optional(),
  avatar_url: imageSchema.optional().nullable().or(z.literal('')),
  whatsapp: whatsappSchema.optional(),
  address: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  payment_alias: z.string().trim().max(60).optional().nullable().or(z.literal('')),
  payment_link: paymentLinkSchema.optional().nullable().or(z.literal('')),
  reviews_url: reviewsUrlSchema.optional().nullable().or(z.literal('')),
  hours: hoursSchema.optional(),
  theme: z.record(z.any()).nullable().optional(),
  slug: slugSchema.optional(),
});

const linkCreateSchema = z.object({
  page_id: z.coerce.number().int().positive(),
  title: z.string().trim().min(1, 'Título requerido').max(80),
  url: urlSchema,
});

const linkUpdateSchema = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  url: urlSchema.optional(),
});

const reorderSchema = z.object({
  links: z
    .array(
      z.object({
        id: z.coerce.number().int().positive(),
        position: z.coerce.number().int().min(0),
      })
    )
    .min(1)
    .max(200),
});

const menuItemSchema = z.object({
  page_id: z.coerce.number().int().positive(),
  product_name: z.string().trim().min(1, 'Nombre requerido').max(80),
  product_description: z.string().trim().max(300).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  image: imageSchema.optional().nullable().or(z.literal('')),
  price: z.coerce.number().min(0).max(99999999).optional().nullable(),
  status: z.enum(['active', 'inactive']).optional(),
});

const menuItemUpdateSchema = menuItemSchema.partial().omit({ page_id: true });

// ========================================
// Middleware helper
// ========================================
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      error: result.error.issues[0]?.message || 'Datos inválidos',
      issues: result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  pageCreateSchema,
  pageUpdateSchema,
  linkCreateSchema,
  linkUpdateSchema,
  reorderSchema,
  menuItemSchema,
  menuItemUpdateSchema,
  slugSchema,
};
