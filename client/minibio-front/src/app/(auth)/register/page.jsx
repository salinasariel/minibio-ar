"use client";
import { apiFetch } from '@/lib/api';
import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Card from '@/components/Card';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    // Validación local
    const validate = () => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;

        if (!email || !emailRegex.test(email)) {
            errors.email = 'Email inválido';
        }
        if (!username || !usernameRegex.test(username)) {
            errors.username = 'Username: 3-30 caracteres, solo letras, números, guiones y guiones bajos';
        }
        if (!password || password.length < 8) {
            errors.password = 'Password: al menos 8 caracteres';
        } else {
            const hasUpper = /[A-Z]/.test(password);
            const hasLower = /[a-z]/.test(password);
            const hasNumber = /[0-9]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);
            if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
                errors.password = 'Debe incluir mayúscula, minúscula, número y carácter especial';
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError('');
        setFieldErrors({});

        if (!validate()) {
            return;
        }

        setLoading(true);

        try {
            const data = await apiFetch('/auth/register', null, {
                method: 'POST',
                body: { email, password, username },
            });

            if (data?.token) {
                // Sin verificación de email (dev/SMTP no configurado): auto-login
                localStorage.setItem('jwt_token', data.token);
                localStorage.setItem('user_data', JSON.stringify(data.user));
                window.location.href = '/dashboard';
                return;
            }

            // Con verificación: mostrar pantalla "revisá tu email"
            setRegistered(true);
        } catch (err) {
            console.error('Error registering:', err);
            setError(err.message || 'Error al registrarse');
        } finally {
            setLoading(false);
        }
    };

    // Pantalla de éxito después del registro
    if (registered) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="w-full max-w-md relative z-10">
                    <Card variant="glass" padding="large" className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Sparkles className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Registro completado!</h2>
                        <p className="text-gray-600 mb-6">
                            Hemos enviado un enlace de verificación a tu email. Haz clic en ese enlace para activar tu cuenta.
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Si no recibes el email en unos minutos, revisa tu carpeta de spam.
                        </p>
                        <div className="space-y-3">
                            <Link href="/login">
                                <Button variant="primary" fullWidth>Ir a Iniciar Sesión</Button>
                            </Link>
                            <Link href="/">
                                <Button variant="secondary" fullWidth>Volver al Inicio</Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Formulario de registro
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="w-full max-w-md relative z-10 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <Sparkles className="text-blue-400 w-10 h-10" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        MiniBio.ar
                    </h1>
                    <p className="text-gray-600">
                        Tu (mini) link-in-bio personalizado
                    </p>
                </div>

                <Card className='p-6 ' variant="glass" padding="large">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Registrarme
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 animate-slide-up">
                            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <p className="text-sm text-red-800 font-medium">{error}</p>
                        </div>
                    )}

                    <div className="text-gray-900 space-y-5">
                        <Input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Nombre de usuario"
                            label="Nombre de usuario"
                            required
                            error={fieldErrors.username}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            label="Email"
                            required
                            error={fieldErrors.email}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            }
                        />

                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            label="Contraseña"
                            required
                            error={fieldErrors.password}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                        />

                        <Button
                            onClick={handleSubmit}
                            variant="primary"
                            size="large"
                            fullWidth
                            loading={loading}
                        >
                            Registrarse
                        </Button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <p className="text-center text-sm text-gray-600">
                            ¿Ya tienes cuenta?{' '}
                            <Link
                                href="/login"
                                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                            >
                                Inicia sesión
                            </Link>
                        </p>
                    </div>
                </Card>

                <p className="text-center text-xs text-gray-500 mt-8">
                    Al continuar, aceptas nuestros <Link href="/terms" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">términos y condiciones</Link>
                </p>
            </div>
        </div>
    );
}