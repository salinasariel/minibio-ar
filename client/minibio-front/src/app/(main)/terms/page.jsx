"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function TermsPage() {
    const [termsData, setTermsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTerms = async () => {
            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL;
                const res = await fetch(`${API_URL}/public/paramPublic/TERMS/ES`);

                if (!res.ok) {
                    throw new Error('Error al cargar los términos');
                }

                const data = await res.json();
                setTermsData(data.param);
            } catch (err) {
                console.error('Error fetching terms:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTerms();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <Card variant="glass" padding="large" className="max-w-md">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link href="/">
                            <Button variant="primary">Volver al inicio</Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {/* Header */}
            <nav className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                                M
                            </div>
                            <span className="text-xl font-bold text-gray-900">MiniBio</span>
                        </Link>
                        <Link href="/">
                            <Button variant="ghost" size="small">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Volver
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Title Section */}
                <div className="text-center mb-12 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/50 mb-6">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        {termsData?.varchar_1 || 'Términos y Condiciones'}
                    </h1>
                    <p className="text-lg text-gray-600">
                        Última actualización:  {termsData?.date_1
                            ? new Date(termsData.date_1).toLocaleDateString("es-AR", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })
                            : "—"}
                    </p>
                </div>

                {/* Terms Content */}
                <Card variant="glass" padding="none" className="animate-slide-up">
                    <div className="p-8 md:p-12">
                        <div
                            className=" text-gray-500 prose prose-lg max-w-none
                prose-headings:text-gray-900 prose-headings:font-bold
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-strong:text-gray-900
                prose-ul:text-gray-700
                prose-ol:text-gray-700
                prose-a:text-blue-600 prose-a:font-semibold hover:prose-a:text-blue-700"
                            dangerouslySetInnerHTML={{
                                __html: formatTermsContent(termsData?.varchar_2)
                            }}
                        />

                        {/* Additional Info if available */}
                        {termsData?.varchar_3 && (
                            <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200">
                                <h3 className="text-lg font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    Información Adicional
                                </h3>
                                <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: formatTermsContent(termsData.varchar_3) }}
                                />
                            </div>
                        )}
                    </div>
                </Card>

                {/* Contact Section */}
                <div className=" mt-12 text-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <Card className="p-8" variant="glass" padding="large">
                        <h3 className="text-xl font-bold text-gray-900 mb-3">
                            ¿Tenes preguntas?
                        </h3>
                        <p className="text-gray-600 mb-6">
                            Si tenes alguna pregunta sobre estos términos y condiciones, contáctanos
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button variant="primary">
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                Enviar Email
                            </Button>
                            <Link href="/">
                                <Button variant="secondary">
                                    Volver al Inicio
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white/70 backdrop-blur-xl border-t border-gray-200/50 py-8 mt-12">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-600">
                    © 2025 MiniBio.ar - Todos los derechos reservados
                </div>
            </footer>
        </div>
    );
}

// Helper function to format terms content
function formatTermsContent(content) {
    if (!content) return '<p>No hay contenido disponible.</p>';

    // Convert line breaks to paragraphs
    let formatted = content
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line}</p>`)
        .join('');

    // Replace **bold** with <strong>
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Replace __italic__ with <em>
    formatted = formatted.replace(/__(.*?)__/g, '<em>$1</em>');

    return formatted;
}