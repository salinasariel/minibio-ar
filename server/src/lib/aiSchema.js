const { z } = require('zod');

// ========================================
// Schema de la propuesta que puede devolver la IA.
// Es la ÚNICA forma que aceptamos: cualquier cosa fuera de esto se descarta.
// ========================================

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color inválido');

// Tokens de estilo: set cerrado que el renderer de la página pública entiende
const themeTokensSchema = z
  .object({
    preset: z.enum(['ocean', 'sunset', 'forest', 'night']).optional(),
    from: hex.optional(),
    to: hex.optional(),
    direction: z.enum(['br', 'b', 'r', 'tr']).optional(),
    font: z.enum(['sans', 'serif', 'mono']).optional(),
    button: z
      .object({
        variant: z.enum(['glass', 'solid', 'outline']).optional(),
        radius: z.enum(['full', '2xl', 'lg']).optional(),
        color: hex.optional(),
      })
      .optional(),
  })
  .strict();

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const aiDay = z
  .object({
    closed: z.boolean().optional(),
    open: z.string().regex(timeRegex).optional(),
    close: z.string().regex(timeRegex).optional(),
  })
  .strict()
  .optional();

const aiPageSchema = z
  .object({
    title: z.string().trim().min(1).max(60).optional(),
    bio: z.string().trim().max(300).optional(),
    theme: themeTokensSchema.optional(),
    whatsapp: z.string().trim().max(20).optional(),
    address: z.string().trim().max(120).optional(),
    payment_alias: z.string().trim().max(60).optional(),
    payment_link: z
      .string()
      .trim()
      .max(300)
      .url()
      .refine((u) => {
        try {
          const h = new URL(u).hostname.toLowerCase();
          return h === 'mpago.la' || h.endsWith('mercadopago.com.ar') || h.endsWith('mercadopago.com');
        } catch { return false; }
      })
      .optional(),
    reviews_url: z
      .string()
      .trim()
      .max(300)
      .url()
      .refine((u) => {
        try {
          const h = new URL(u).hostname.toLowerCase();
          return h === 'g.page' || h === 'maps.app.goo.gl' || h.endsWith('google.com') || h.endsWith('google.com.ar');
        } catch { return false; }
      })
      .optional(),
    hours: z
      .object({ mon: aiDay, tue: aiDay, wed: aiDay, thu: aiDay, fri: aiDay, sat: aiDay, sun: aiDay })
      .strict()
      .optional(),
    links: z
      .array(
        z.object({
          title: z.string().trim().min(1).max(80),
          url: z.string().trim().max(2048).url().refine((u) => /^https?:\/\//i.test(u)),
        }).strict()
      )
      .max(10)
      .optional(),
    products: z
      .array(
        z.object({
          product_name: z.string().trim().min(1).max(80),
          product_description: z.string().trim().max(300).optional(),
          category: z.string().trim().max(40).optional(),
          price: z.number().min(0).max(99999999).optional(),
        }).strict()
      )
      .max(25)
      .optional(),
  })
  .strict();

const aiResponseSchema = z
  .object({
    notes: z.string().max(500).optional(),
    page: aiPageSchema,
  })
  .strict();

module.exports = { aiResponseSchema, themeTokensSchema };
