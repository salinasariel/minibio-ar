-- Migración manual: slug único en pages + menus con cascade
-- Ejecutar UNA VEZ sobre la DB existente (psql o el SQL editor de Neon/Railway).
-- Después de esto, `npx prisma db pull` / `npx prisma generate` quedan consistentes.

BEGIN;

-- 1. Agregar slug a pages y backfillear desde el título
ALTER TABLE pages ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE pages
SET slug = trim(both '-' from lower(regexp_replace(coalesce(nullif(title, ''), 'pagina'), '[^a-zA-Z0-9]+', '-', 'g'))) || '-' || id
WHERE slug IS NULL;

ALTER TABLE pages ALTER COLUMN slug SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS pages_slug_key ON pages(slug);

-- 2. menus: page_id obligatorio + borrado en cascada
DELETE FROM menus WHERE page_id IS NULL;
ALTER TABLE menus ALTER COLUMN page_id SET NOT NULL;
ALTER TABLE menus DROP CONSTRAINT IF EXISTS menus_page_id_fkey;
ALTER TABLE menus
  ADD CONSTRAINT menus_page_id_fkey
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE;

-- 2b. pages: avatar propio por página
ALTER TABLE pages ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. users: campos de verificación de email
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_expires TIMESTAMP(3);

-- Usuarios existentes: marcarlos como verificados para no bloquearles el login
UPDATE users SET email_verified = true WHERE email_verified = false;

-- 4. password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP(3) NOT NULL,
  used_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4b. features: whatsapp + horarios en pages, categoría en menus
ALTER TABLE pages ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS hours JSONB;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS payment_alias TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE pages ADD COLUMN IF NOT EXISTS reviews_url TEXT;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS category TEXT;

-- 4c. IA beta: flag por usuario (activado solo para la cuenta admin)
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET ai_enabled = true WHERE email = 'minibioarg@gmail.com';

-- 4d. Admin: flag solo asignable por DB
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
UPDATE users SET is_admin = true WHERE email = 'minibioarg@gmail.com';

-- 4e. Planes
CREATE TABLE IF NOT EXISTS plans (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  features JSONB,
  max_pages INTEGER NOT NULL DEFAULT 1,
  max_links INTEGER NOT NULL DEFAULT 10,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id INTEGER REFERENCES plans(id) ON DELETE SET NULL;

INSERT INTO plans (code, name, features, max_pages, max_links, is_default) VALUES
  ('free', 'Gratis', '["whatsapp","address","hours","products","stats"]', 2, 10, true),
  ('pro', 'Pro', '["whatsapp","address","hours","products","stats","payment","reviews","custom_theme","ai"]', 5, 50, false)
ON CONFLICT (code) DO NOTHING;

-- 4f. Referidos
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_by_referral BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key ON users(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users(referred_by);

-- 5. stat_events: analítica de visitas y clicks
CREATE TABLE IF NOT EXISTS stat_events (
  id SERIAL PRIMARY KEY,
  page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  link_id INTEGER,
  type TEXT NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS stat_events_page_id_created_at_idx ON stat_events(page_id, created_at);

COMMIT;

-- Si la DB es NUEVA (sin datos), ignorá este archivo y corré directamente:
--   npx prisma migrate dev --name init
