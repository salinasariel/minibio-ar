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

    // Desarrollo local usando localhost directo
    if (hostname.includes('localhost') && !hostname.includes('.')) {
        return null;
    }

    // Si es localhost con subdominio (ej: app.localhost)
    if (hostname.includes('localhost') && hostname.split('.').length > 1) {
        const parts = hostname.split('.');
        if (parts[0] !== 'localhost') return parts[0];
    }

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'minibio.ar';
    const domain = hostname.split(':')[0]; // Remover puerto si existe

    console.log('   📍 Domain limpio:', domain);
    console.log('   📍 Root Domain config:', rootDomain);

    // Si es el dominio raíz (ej: minibio.local o www.minibio.local)
    if (domain === rootDomain || domain === `www.${rootDomain}`) {
        console.log('   📍 Es dominio principal');
        return null;
    }

    // Extraer subdominio
    if (domain.endsWith(`.${rootDomain}`)) {
        const subdomain = domain.replace(`.${rootDomain}`, '');
        console.log('   📍 Subdomain final:', subdomain);
        return subdomain;
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