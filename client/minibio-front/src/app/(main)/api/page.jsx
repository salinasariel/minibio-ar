import Link from 'next/link';

export const metadata = {
  title: 'API pública · MiniBio',
  description: 'Documentación de la API pública de MiniBio: turnos y estadísticas de tus páginas.',
};

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.minibio.ar/api'}/v1`;

// Bloque de código con estilo consistente
function CodeBlock({ children }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-2xl p-5 text-sm leading-relaxed overflow-x-auto mb-6">
      <code>{children}</code>
    </pre>
  );
}

function Endpoint({ method, path, plan, children }) {
  const methodColors = {
    GET: 'bg-emerald-100 text-emerald-700',
    POST: 'bg-blue-100 text-blue-700',
    PATCH: 'bg-amber-100 text-amber-700',
  };
  return (
    <div className="mb-10">
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-semibold text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg">
          {path}
        </code>
        {plan && (
          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-semibold">
            Requiere plan con {plan}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-900 antialiased">
      {/* Nav */}
      <nav className="border-b border-gray-200/70 bg-[#fafaf8]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            minibio<span className="text-indigo-600">.ar</span>
          </Link>
          <span className="text-sm font-semibold text-gray-500">API pública</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Intro */}
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700 bg-indigo-100 rounded-full px-3 py-1 mb-5">
          v1 · Beta
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">API pública</h1>
        <p className="text-lg text-gray-600 leading-relaxed mb-2 max-w-2xl">
          Integrá tus turnos y estadísticas de MiniBio con tus propios sistemas:
          consultá reservas, creá turnos, confirmalos o cancelalos, y traé las
          métricas de todas tus páginas.
        </p>
        <p className="text-sm text-gray-500 mb-10 max-w-2xl">
          La creación de páginas, turneros y recursos no está disponible por API:
          se administra desde la app de MiniBio. Los endpoints de turnos requieren
          un plan con la función de reservas; el de estadísticas, un plan con estadísticas.
        </p>

        {/* Base URL */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">URL base</h2>
        <CodeBlock>{API_BASE}</CodeBlock>

        {/* Auth */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">Autenticación</h2>
        <p className="text-gray-600 mb-4 max-w-2xl">
          Iniciá sesión con tu email y contraseña de MiniBio. La respuesta incluye un
          token que dura 7 días; mandalo en el header{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">Authorization: Bearer &lt;token&gt;</code>{' '}
          en el resto de las llamadas.
        </p>

        <Endpoint method="POST" path="/auth/login">
          <CodeBlock>{`curl -X POST ${API_BASE}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{ "email": "tu@email.com", "password": "tu-contraseña" }'

# Respuesta
{
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "username": "minegocio", "plan": { "code": "pro", ... } }
}`}</CodeBlock>
        </Endpoint>

        {/* Páginas */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">Páginas</h2>
        <Endpoint method="GET" path="/pages">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Lista tus páginas con su <code className="bg-gray-100 px-1 rounded text-sm">id</code> (lo
            necesitás para filtrar turnos y consultar recursos).
          </p>
          <CodeBlock>{`curl ${API_BASE}/pages -H "Authorization: Bearer <token>"

# Respuesta
{ "pages": [ { "id": 12, "title": "Barbería Roma", "slug": "barberia-roma", "created_at": "..." } ] }`}</CodeBlock>
        </Endpoint>

        {/* Turnos */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">Turnos</h2>

        <Endpoint method="GET" path="/bookings" plan="reservas">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Todos los turnos de todas tus páginas. Filtros opcionales:{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">from</code> y{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">to</code> (fecha{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">YYYY-MM-DD</code>, hora argentina),{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">status</code> (
            pending · confirmed · cancelled · no_show · done) y{' '}
            <code className="bg-gray-100 px-1 rounded text-sm">page_id</code>.
          </p>
          <CodeBlock>{`curl "${API_BASE}/bookings?from=2026-07-13&to=2026-07-20&status=confirmed" \\
  -H "Authorization: Bearer <token>"

# Respuesta
{
  "bookings": [
    {
      "id": 28, "starts_at": "2026-07-13T13:00:00.000Z", "ends_at": "2026-07-13T13:30:00.000Z",
      "customer_name": "Juan Pérez", "customer_phone": "3415551234",
      "status": "confirmed", "notes": null,
      "resource": { "id": 3, "name": "Corte de pelo" },
      "page": { "id": 12, "title": "Barbería Roma", "slug": "barberia-roma" }
    }
  ]
}`}</CodeBlock>
        </Endpoint>

        <Endpoint method="GET" path="/resources/:pageId" plan="reservas">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Recursos reservables de una página (nombre, duración, cantidad simultánea)
            y su configuración. Necesitás el <code className="bg-gray-100 px-1 rounded text-sm">resource_id</code>{' '}
            para crear turnos.
          </p>
          <CodeBlock>{`curl ${API_BASE}/resources/12 -H "Authorization: Bearer <token>"`}</CodeBlock>
        </Endpoint>

        <Endpoint method="POST" path="/bookings" plan="reservas">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Crea un turno (equivale a la carga manual de la app: queda confirmado).
            El horario debe caer en un slot válido según la duración y los horarios del
            recurso, y respeta la capacidad simultánea — si el horario está lleno
            responde <code className="bg-gray-100 px-1 rounded text-sm">409</code>.
          </p>
          <CodeBlock>{`curl -X POST ${API_BASE}/bookings \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "page_id": 12,
    "resource_id": 3,
    "starts_at": "2026-07-13T10:00:00-03:00",
    "customer_name": "Juan Pérez",
    "customer_phone": "3415551234",
    "notes": "opcional"
  }'`}</CodeBlock>
        </Endpoint>

        <Endpoint method="PATCH" path="/bookings/:id" plan="reservas">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Cambia el estado de un turno: confirmarlo, cancelarlo, marcar que el
            cliente no vino o que se completó.
          </p>
          <CodeBlock>{`curl -X PATCH ${API_BASE}/bookings/28 \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" \\
  -d '{ "status": "confirmed" }'

# status: "pending" | "confirmed" | "cancelled" | "no_show" | "done"`}</CodeBlock>
        </Endpoint>

        {/* Stats */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">Estadísticas</h2>
        <Endpoint method="GET" path="/stats" plan="estadísticas">
          <p className="text-gray-600 mb-3 max-w-2xl">
            Las mismas métricas que ves en la app, de todas tus páginas: visitas,
            clicks, CTR, top links, serie diaria de 30 días y números de reservas
            (totales, próximas, pendientes, no-shows). Solo lectura.
          </p>
          <CodeBlock>{`curl ${API_BASE}/stats -H "Authorization: Bearer <token>"

# Respuesta (resumen)
{
  "totals": { "pages": 2, "views": 340, "clicks": 120, "ctr": 35,
              "bookings": 48, "bookings_upcoming": 6, "bookings_pending": 2, ... },
  "pages": [ { "id": 12, "title": "Barbería Roma", "views": 210, "clicks": 80,
               "bookings": { "total": 48, "upcoming": 6, "no_show": 3, ... }, ... } ],
  "top_links": [ ... ],
  "daily": [ { "day": "2026-07-01", "type": "view", "count": 14 }, ... ]
}`}</CodeBlock>
        </Endpoint>

        {/* Errores y límites */}
        <h2 className="text-2xl font-bold tracking-tight mb-3">Errores y límites</h2>
        <ul className="space-y-2 text-gray-600 mb-10 max-w-2xl list-disc pl-5">
          <li><code className="bg-gray-100 px-1 rounded text-sm">401</code> — token faltante, inválido o vencido.</li>
          <li><code className="bg-gray-100 px-1 rounded text-sm">403</code> — tu plan no incluye esa funcionalidad, o el recurso no es tuyo.</li>
          <li><code className="bg-gray-100 px-1 rounded text-sm">409</code> — el horario del turno ya está completo.</li>
          <li><code className="bg-gray-100 px-1 rounded text-sm">429</code> — demasiadas peticiones (límite general: 120 por minuto por IP; login: 20 cada 15 minutos).</li>
          <li>Los errores siempre vienen como <code className="bg-gray-100 px-1 rounded text-sm">{'{ "error": "mensaje" }'}</code>.</li>
        </ul>

        {/* CTA */}
        <div className="rounded-3xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50 to-white p-8 text-center">
          <h3 className="text-xl font-bold mb-2">¿Todavía no tenés tu turnero?</h3>
          <p className="text-gray-600 mb-5">
            Creá tu página en MiniBio y activá las reservas online con el plan Pro.
          </p>
          <a
            href="https://app.minibio.ar/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            Crear mi página
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200/70 py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} MiniBio.ar · <Link href="/" className="text-indigo-600 hover:underline">Volver al inicio</Link>
      </footer>
    </div>
  );
}
