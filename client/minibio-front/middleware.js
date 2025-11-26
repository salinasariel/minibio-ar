import { NextResponse } from 'next/server';

export function middleware(request) {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';
    const pathname = url.pathname;

    // Log para debugging (eliminar en producción)
    console.log('🌐 Middleware ejecutándose:');
    console.log('   Host:', hostname);
    console.log('   Path:', pathname);

    // Extraer el subdominio
    const subdomain = getSubdomain(hostname);
    console.log('   Subdomain detectado:', subdomain || '(ninguno)');

    // ========================================
    // Excluir archivos estáticos y API de Next.js
    // ========================================
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') // archivos con extensión
    ) {
        return NextResponse.next();
    }

    // ========================================
    // CASO 1: Dominio principal (minibio.ar o www.minibio.ar)
    // ========================================
    if (!subdomain || subdomain === 'www') {
        console.log('   → Ruta: Dominio principal');
        return NextResponse.next();
    }

    // ========================================
    // CASO 2: App subdomain (app.minibio.ar)
    // ========================================
    if (subdomain === 'app') {
        console.log('   → Ruta: App subdomain (dashboard)');

        // Si está en la raíz de app, redirigir al dashboard
        if (pathname === '/') {
            url.pathname = '/dashboard';
            console.log('   → Redirect a /dashboard');
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    }

    // ========================================
    // CASO 3: Cualquier otro subdominio = Usuario
    // ========================================
    console.log('   → Ruta: Subdominio de usuario');

    // Reescribir username.minibio.ar → /profile/username
    url.pathname = `/profile/${subdomain}`;
    console.log('   → Rewrite a:', url.pathname);

    return NextResponse.rewrite(url);
}

// ========================================
// Helper: Extraer subdominio
// ========================================
function getSubdomain(hostname) {
    console.log('   📍 Analizando hostname:', hostname);

    // Desarrollo local
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
        // Para testing local: username.localhost:3000
        const parts = hostname.split('.');
        console.log('   📍 Partes (local):', parts);

        if (parts.length >= 2 && parts[0] !== 'localhost') {
            console.log('   📍 Subdomain (local):', parts[0]);
            return parts[0];
        }
        return null;
    }

    // Producción - minibio.ar
    let domain = hostname;

    // Remover puerto si existe
    if (domain.includes(':')) {
        domain = domain.split(':')[0];
    }

    console.log('   📍 Domain limpio:', domain);

    // Casos de dominio principal
    if (domain === 'minibio.ar' || domain === 'www.minibio.ar') {
        console.log('   📍 Es dominio principal');
        return null;
    }

    // Extraer subdominio
    // Ej: app.minibio.ar → app
    // Ej: juan.minibio.ar → juan
    const withoutDomain = domain.replace('.minibio.ar', '');

    console.log('   📍 Sin dominio base:', withoutDomain);

    // Si después de remover .minibio.ar queda algo, es el subdominio
    if (withoutDomain !== domain && withoutDomain.length > 0) {
        console.log('   📍 Subdomain final:', withoutDomain);
        return withoutDomain;
    }

    return null;
}

// ========================================
// Configuración del middleware
// ========================================
export const config = {
    matcher: [
        /*
         * Match all paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico (favicon file)
         * - public folder files
         * - api routes
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
    ],
};