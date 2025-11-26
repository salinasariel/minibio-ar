"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, TrendingUp, ArrowRight, CheckCircle, Globe, Share2 } from 'lucide-react';

export default function MiniBioLanding() {
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Globe, title: 'Presencia Digital', desc: 'Tu (mini) link-in-bio en minutos' },
    { icon: Share2, title: 'Facil de compartir', desc: 'Un solo enlace para todo' },
    { icon: TrendingUp, title: 'Hacé crecer tu negocio', desc: 'Soluciones sin complicaciones' }
  ];

  const benefits = [
    'Listo rápido',
    'Personaliza tu diseño',
    'Catalogo de productos',
    'Cartas para restaurantes',
    'Reservas para tu negocio',
    'Actualizá tu contenido cuando quieras',
    'Planes profesionales accesibles'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ top: '10%', left: '10%', transform: `translateY(${scrollY * 0.3}px)` }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"
          style={{ top: '60%', right: '10%', animationDelay: '1s', transform: `translateY(${scrollY * 0.2}px)` }}
        />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <nav className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 text-2xl font-bold transition-all duration-700 ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
              <Sparkles className="text-yellow-400" />
              <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
                MiniBio.ar
              </span>
            </div>
            <a
              href="/login"
              className={`px-6 py-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all duration-300 hover:scale-105 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            >
              Iniciar Sesión
            </a>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Tu Marca Personal
                <span className="block bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  en un Solo Link
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 mb-12 max-w-2xl mx-auto">
                La plataforma perfecta para emprendedores que quieren destacar online. Creá tu perfil profesional y compartí todo lo que haces.
              </p>
              <a
                href="/register"
                className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full text-lg font-semibold text-gray-900 hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-pink-500/50"
              >
                Comenzar Gratis
                <ArrowRight className="animate-pulse" />
              </a>
            </div>

            {/* Floating Cards */}
            <div className="mt-20 relative">
              <div className={`grid md:grid-cols-3 gap-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {features.map((feature, i) => (
                  <div
                    key={i}
                    className="group p-6 bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <feature.icon className="w-12 h-12 mb-4 text-yellow-400 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-purple-200">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative py-20 bg-black/20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Todo lo que Necesitas para
                <span className="block text-yellow-400">Crecer Online</span>
              </h2>
              <p className="text-xl text-purple-200">
                Diseñado especialmente para emprendedores
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-6 bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:translate-x-2"
                >
                  <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <Zap className="w-16 h-16 text-yellow-400 mx-auto mb-6 animate-bounce" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              ¿Listo para Impulsar tu Marca?
            </h2>
            <p className="text-xl text-purple-200 mb-10">
              La hacemos facil, para que te preocupes de lo importante.
            </p>
            <a
              href="/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full text-xl font-semibold text-gray-900 hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-pink-500/50"
            >
              Comenzar Ahora
              <ArrowRight className="animate-pulse" />
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-12 border-t border-white/10">
        <div className="container mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-bold mb-4">
            <Sparkles className="text-yellow-400" />
            <span className="bg-gradient-to-r from-yellow-400 to-pink-400 bg-clip-text text-transparent">
              MiniBio.ar
            </span>
          </div>
          <p className="text-purple-200">
            © 2025 MiniBio.ar - Consulta nuestros <Link href="/terms" className="font-semibold text-gray-200 hover:text-black-700 hover:underline">términos y condiciones</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}