# MiniBio.ar — Análisis y Plan de MVP

> **Estado (2026-07-05):** Fases 0, 1 y 2 implementadas (slug único, seguridad/validación, CRUD de menú, temas, editor completo, verificación de email + reset de contraseña integrados). Pendiente de tu lado: correr `server/prisma/manual_migration_slug.sql` en la DB, `npx prisma generate`, y probar el flujo end-to-end. Fase 3 (deploy) sin empezar.

**Alcance acordado:** link-in-bio + menú digital · slug único por página · deploy Vercel + Railway/Neon · gratis al inicio.

---

## 1. Errores encontrados

### Bugs que rompen funcionalidad hoy

1. **Tracking de clicks nunca funciona.** El perfil público hace `POST /links/${id}` pero la ruta es `POST /links/:id/click` → 404 en cada click. (`profile/[pageName]/page.jsx` vs `link.routes.js`)
2. **Perfil público busca por título de página, no por identificador único.** `getLinksByPageName` hace `findFirst({ where: { title: pageName } })`. El título no es único, puede tener espacios/mayúsculas, y el middleware pasa el *subdominio* (que hoy sería el username). Dos páginas "Mi Negocio" colisionan. → Se resuelve con el campo `slug`.
3. **Crash 500 en páginas inexistentes.** En `getLinksByPage` y `getLinksByPageName` se accede a `page.user_id` (console.log) *antes* del chequeo `if (!page)` → TypeError → 500 en vez de 404.
4. **Bugs de render en el perfil público:** usa `links.avatar_url` (objeto equivocado), `src={profile.theme}` como URL de avatar, y `profile.title[0]` explota si el título está vacío.
5. **`GET /api/links/page/:pageId` no tiene `verifyToken`** pero el dashboard de edición lo usa como si fuera privado: cualquiera puede leer los links de cualquier página por ID. Además el controller lee `req.user` que no existe si se llama sin token.
6. **`register` se desestructura de `useAuth()` pero `AuthContext` no lo expone** (hoy no rompe porque no se usa, pero es una bomba latente).
7. **No hay migraciones de Prisma** (`prisma/` solo tiene el schema; `prisma.config.ts` fue borrado y quedó un `.bak`). La DB no es reproducible.
8. **`/api/routes` (debug) probablemente crashea en Express 5** (`app._router` cambió). Además no debería existir en producción.
9. **Swagger instalado pero nunca montado** en `index.js` (dependencia muerta o falta wiring).

### Problemas de seguridad (bloqueantes para salir a mercado)

10. **Login revela si el email existe** (404 "Usuario no encontrado" vs 401 "Contraseña incorrecta") → enumeración de usuarios. Devolver siempre 401 genérico.
11. **`reorderLinks` solo verifica ownership del primer link** → mezclando IDs podés reordenar links ajenos.
12. **`GET /api/pages/all` expone emails de todos los usuarios** a cualquier usuario autenticado. Eliminar o proteger con rol admin.
13. **Cero validación de entrada:** email sin formato, password vacía (bcrypt de `undefined` → 500), URLs sin validar (permite `javascript:`), sin límites de longitud. Agregar `zod` o `express-validator`.
14. **Errores devuelven `details: error.message`** → filtra internals de Prisma/DB al cliente.
15. **Sin rate limiting ni helmet:** register/login son fuerza-bruteables. Agregar `express-rate-limit` + `helmet`.
16. **CORS abierto a todo origen** (`cors()` sin config). Restringir a los dominios propios en producción.
17. **JWT 1h en localStorage sin refresh ni manejo de expiración:** a la hora, todo empieza a fallar en silencio (el front no redirige al login en 401). Mínimo: interceptar 401 en `apiFetch` → logout; idealmente expiración más larga o refresh token.
18. **Sin chequeo de `JWT_SECRET`** al arrancar: si falta la env var, se firman tokens con `undefined`.

### Deuda / limpieza

- `console.log` en middleware de Next y controllers (incluye datos de usuarios).
- `next.config.mjs`: `allowedDevOrigins` con entradas duplicadas.
- Modelo `MinibioParam` (columnas genéricas varchar_1/number_1…): funciona para i18n de textos, pero documentarlo o reemplazar por tabla concreta.
- `client/package-lock.json` suelto fuera de `minibio-front/`.
- README vacío, sin `.env.example`, sin tests, sin CI, sin nada de deploy.
- `Order`/`Menu` usan `onDelete: SetNull` con `page_id` nullable → menús huérfanos; para Menu conviene `Cascade`.

---

## 2. Plan hacia el MVP

### Fase 0 — Fundaciones (1-2 días)
- [ ] Crear `prisma migrate dev` inicial; agregar `slug String @unique` a `Page` (generado del título, editable, validado `[a-z0-9-]`).
- [ ] `.env.example` en server y front; chequeo de env vars al boot (fallar si falta `JWT_SECRET`/`DATABASE_URL`).
- [ ] Eliminar `/api/routes`, `prisma.config.ts.bak`, logs de debug; montar Swagger solo en dev (o quitar la dependencia).

### Fase 1 — Corregir bugs y seguridad (2-4 días)
- [ ] Fix tracking de clicks (endpoint correcto en el front).
- [ ] Reescribir endpoint público: `GET /api/public/page/by-slug/:slug` (page + links + menú). El middleware de subdominios pasa el slug.
- [ ] Proteger `GET /links/page/:pageId` con `verifyToken` + ownership; borrar `getLinksByPageName` (reemplazado por slug).
- [ ] Fix crashes de `page.user_id` pre-check y render del perfil (avatar, título vacío).
- [ ] Login 401 genérico; `reorderLinks` valida ownership de *todos* los links; eliminar `/pages/all`.
- [ ] Validación con `zod` en auth/pages/links (email, password ≥8, URL http/https, longitudes).
- [ ] `helmet`, `express-rate-limit` (estricto en /auth), CORS por whitelist, quitar `details` de errores en prod.
- [ ] `apiFetch`: en 401 → logout + redirect a login. Subir expiración del JWT a 7d para el MVP.

### Fase 2 — Completar features del MVP (4-7 días)
- [ ] **Menú digital:** CRUD de `Menu` (endpoints + ownership) y UI en el editor (nombre, descripción, precio, imagen, estado). Render del menú en el perfil público (sección debajo de los links).
- [ ] **Imágenes** (avatar y productos): upload a Cloudinary/S3 o, para acortar, solo URL externa en el MVP.
- [ ] **Editor de página:** editar título/bio/slug/avatar; aplicar `theme` real en el perfil público (hoy se guarda pero no se usa) — con 3-4 temas predefinidos alcanza.
- [ ] **Registro → onboarding:** login automático post-registro y creación de la primera página con slug sugerido.
- [ ] **Estadísticas mínimas:** clicks por link ya existen; mostrarlas bien en el dashboard (+ contador de visitas de página si da el tiempo).
- [ ] Landing: CTA y demo apuntando al flujo real.

### Fase 3 — Deploy y lanzamiento (2-3 días)
- [ ] DB en Neon o Railway Postgres; `prisma migrate deploy` en el pipeline.
- [ ] API en Railway (variables de entorno, CORS a dominios finales, `NODE_ENV=production`).
- [ ] Front en Vercel: dominio `minibio.ar` + wildcard `*.minibio.ar` (requiere plan Pro para wildcard; alternativa sin costo: lanzar con rutas `minibio.ar/<slug>` y activar subdominios después — el middleware ya soporta ambos).
- [ ] SEO básico del perfil público: pasarlo a Server Component con `generateMetadata` (título, descripción, OG image) — hoy es 100% client-side y no indexa.
- [ ] Smoke tests del flujo completo: registro → crear página → links + menú → ver perfil público → click tracking.
- [ ] Términos y privacidad (la página `/terms` existe, completarla), y analytics (Plausible/Umami o GA).

### Post-MVP (v2)
Pedidos (`Order`) con WhatsApp checkout, temas personalizados, dominios propios, plan premium con MercadoPago, refresh tokens, tests automatizados y CI.

**Estimación total: ~2-3 semanas** de trabajo enfocado para un MVP publicable.
