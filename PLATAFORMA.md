# MiniBio.ar — Descripción de la plataforma

> Documento de referencia para análisis de modelo de negocio. Describe qué es el producto, qué funcionalidades tiene hoy, cómo están organizados los planes y cuál es la estructura de costos actual. Estado: MVP funcional en producción, en desarrollo activo, 100% gratuito durante esta etapa.

## Qué es

MiniBio.ar es una plataforma argentina de páginas **link-in-bio** (tipo Linktree) orientada a **emprendedores, negocios locales y profesionales independientes**: cafeterías, barberías, canchas de fútbol, pastelerías, freelancers, creadores. Cada usuario arma una o más páginas públicas con sus links, catálogo de productos y datos de contacto, accesibles en una URL propia con subdominio: `tunegocio.minibio.ar`.

El diferencial buscado es la **adaptación al mercado argentino**: venta por WhatsApp, pagos por transferencia (alias/CVU) y MercadoPago, ajuste rápido de precios por inflación, lenguaje local.

## Público objetivo

- Gastronomía (cartas digitales con QR para la mesa)
- Servicios y turnos (barberías, estética, profesionales)
- Tiendas y emprendimientos que venden por Instagram/WhatsApp
- Creadores de contenido

## Funcionalidades de la página pública (lo que ve el visitante)

- **Links** ordenables, con íconos automáticos según la red (Instagram, WhatsApp, TikTok, YouTube, MercadoLibre, Spotify, LinkedIn, etc.) y contador de clicks.
- **Botón destacado de WhatsApp** que abre el chat con mensaje precargado.
- **Catálogo / carta de productos** con foto (ampliable en lightbox), precio, descripción y agrupación por categorías. Precios en ARS.
- **Datos de pago:** alias/CVU con botón "copiar" de un tap + botón "Pagar con MercadoPago" (link de pago).
- **Ubicación** con chip "cómo llegar" que abre Google Maps.
- **Horarios de atención** con indicador automático "Abierto ahora / Cerrado" (soporta horarios nocturnos que cruzan medianoche).
- **Botón de reseñas de Google** ("Dejanos tu reseña").
- **Código QR** de la página, con el logo del negocio incrustado, descargable en alta calidad para imprimir.
- **Botón compartir** (share nativo en móvil; copia + WhatsApp Web en desktop).
- **Personalización visual:** 4 temas predefinidos, degradados custom de 2 colores, colores sugeridos automáticamente desde la foto de perfil, opción aleatoria, tipografías y estilos de botón.
- Foto de perfil propia por página.

## Funcionalidades del panel de usuario

- **Multi-páginas** por cuenta (límite según plan).
- **Editor por pestañas** (Página / Links / Productos) con secciones opcionales agregables con "+" (WhatsApp, ubicación, pago, reseñas, horarios).
- **Drag & drop** para ordenar links.
- **Ajuste rápido de precios:** aplicar +X% a todos los productos de una vez (pensado para inflación).
- **Plantillas** al crear página (Gastronomía, Tienda, Servicios, Personal) con links de ejemplo y tema precargado.
- **Estadísticas:** visitas y clicks totales y últimos 7 días, CTR, gráfico diario de 14 días, top links, desglose por página.
- **Compresión automática de imágenes** en el navegador (no requiere infraestructura de storage).
- **Asistente IA (beta):** el usuario describe su negocio en lenguaje natural y la IA arma o modifica la página completa (contenido, links, productos, horarios, estilo visual). Con vista previa y confirmación, guardarraíles anti-abuso y capacidad de rehacer de cero. Motor: Gemini (free tier).

## Sistema de cuentas

- Registro con email + verificación por email (SMTP) y recuperación de contraseña.
- Autenticación JWT (7 días).

## Planes (sistema flexible)

Sistema de planes con **catálogo de 9 features activables por plan** desde el panel admin, más límites numéricos (páginas por cuenta, links por página). Los gates se aplican server-side.

| | **Gratis** (default) | **Pro** |
|---|---|---|
| Páginas | 2 | 5 |
| Links por página | 10 | 50 |
| Productos/carta | ✔ | ✔ |
| Estadísticas | ✔ | ✔ |
| WhatsApp, ubicación, horarios | ✔ | ✔ |
| Datos de pago (alias + MP) | ✘ | ✔ |
| Reseñas de Google | ✘ | ✔ |
| Estilos personalizados | ✘ | ✔ |
| Asistente IA | ✘ | ✔ |

Los planes, sus features y límites son **editables en caliente** desde el panel admin sin tocar código. Es trivial agregar un tercer plan.

## Programa de referidos (motor de crecimiento actual)

- Cada usuario tiene un link de invitación único.
- Si un invitado (con otro email) crea su cuenta y su página junta **10+ clicks**, el referidor gana **Pro sin pagar**.
- El Pro se mantiene mientras al menos un referido siga **activo** (5+ clicks en los últimos 30 días); si no, vuelve a Gratis automáticamente.
- Umbrales configurables. El premio nunca pisa un plan asignado manualmente por un admin.
- Diseño pensado para que el incentivo dependa de **usuarios reales activos**, no de registros vacíos.

## Panel de administración

- ABM de usuarios (alta manual verificada, edición, baja con cascade) con búsqueda.
- Gestión de páginas de cualquier usuario.
- Edición de planes (features y límites) y asignación de plan por usuario.
- Toggle de verificación de email y acceso a IA por usuario.
- **Modo demo:** entrar a la app como cualquier usuario (impersonation auditada, 1 h, sin heredar rol admin) para soporte.
- El rol admin solo se asigna por base de datos.

## Analítica interna

- Eventos con timestamp de visitas a páginas y clicks en links (tabla propia, sin dependencias externas).
- Base para: estadísticas del usuario, programa de referidos, y futuros reportes.

## Infraestructura y costos actuales (relevante para unit economics)

| Componente | Servicio | Costo actual |
|---|---|---|
| Frontend (Next.js) | Vercel | $0 (plan free; wildcard de subdominios requiere Pro ~USD 20/mes) |
| API (Node/Express) | Render | $0 (free tier, con keep-alive por cron externo) |
| Base de datos (PostgreSQL) | Neon | $0 (free tier, 500 MB) |
| Emails transaccionales | Gmail SMTP | $0 (~500/día) |
| IA | Gemini free tier | $0 (con rate limit de 15 usos/día/usuario) |
| Imágenes | Base64 en DB (comprimidas client-side) | $0 (limita escala; migrar a Cloudinary/S3 al crecer) |
| Dominio | minibio.ar | costo anual del dominio |

**Costo marginal por usuario hoy: ~$0.** Los primeros cuellos de botella al escalar: storage de imágenes en DB (Neon 500 MB), horas del free tier de Render, y wildcard SSL de Vercel.

## Estado y roadmap corto

- **Hecho:** todo lo listado arriba, en producción.
- **Backlog priorizado:** carrito simple con pedido por WhatsApp (armar el mensaje con productos elegidos), SEO/previews OG del perfil público (hoy es client-side y no genera preview al compartir), links programados por fecha, duplicar página, resumen semanal por email, vCard descargable, dedupe de clicks por IP.
- **Sin implementar (posibles fuentes de ingreso):** pagos integrados (MercadoPago checkout), dominios propios, marca blanca, remoción del footer "Creá tu MiniBio".

## Datos para el modelo de negocio

- Mercado de referencia: el e-commerce argentino creció 55-79% en 2025 (CACE); 1 de cada 4 ventas online se paga por transferencia; WhatsApp es el canal de venta dominante en pymes.
- Competidores globales (Linktree, Beacons, Taplink) cobran USD 5-24/mes, no resuelven transferencia/alias, MercadoPago ni precios inflacionarios, y su soporte en español es limitado.
- Competidores locales de nicho: cartas QR gastronómicas (Simplemenú, SoyMenu) y sistemas de turnos (ReservaSimple, Gendu) — verticales, no integrados.
- El producto es hoy 100% gratuito "durante el desarrollo" (comunicado así en la landing); el plan Pro existe y solo se obtiene por referidos, lo que genera hábito de valor premium sin fricción de pago.
