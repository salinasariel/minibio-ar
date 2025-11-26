"use client";

import Link from 'next/link';
import Button from '@/components/Button';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 p-4">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>

                {/* Content */}
                <h1 className="text-6xl font-bold text-white mb-4">404</h1>
                <h2 className="text-2xl font-bold text-white mb-4">Usuario no encontrado</h2>
                <p className="text-gray-400 mb-8">
                    Este perfil no existe o ha sido eliminado. Verifica que hayas escrito correctamente el nombre de usuario.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="https://minibio.ar">
                        <Button variant="primary" size="large">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Ir al inicio
                        </Button>
                    </Link>
                    <Link href="https://minibio.ar/register">
                        <Button variant="glass" size="large">
                            Crear mi MiniBio
                        </Button>
                    </Link>
                </div>

                {/* Help text */}
                <p className="text-gray-500 text-sm mt-8">
                    ¿Este perfil debería existir?{' '}
                    <a href="mailto:soporte@minibio.ar" className="text-blue-400 hover:underline">
                        Contáctanos
                    </a>
                </p>
            </div>
        </div>
    );
}