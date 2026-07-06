"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, CheckCircle, Globe, Share2, QrCode, BarChart3, UtensilsCrossed, Palette, Mail } from 'lucide-react';

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
    { icon: Globe, title: 'Tu página con tu nombre', desc: 'tunegocio.minibio.ar con todos tus links en un solo lugar' },
    { icon: UtensilsCrossed, title: 'Menú con fotos y precios', desc: 'Cargá tus productos o tu carta' },
    { icon: BarChart3, title: 'Estadísticas', desc: 'Visitas, clicks por link y actividad de los últimos días' }
  ];

  const benefits = [
    'Tu dirección propia: elegís el nombre de tu página',
    'Menú o catálogo con fotos, precios y descripciones',
    'Foto de perfil y colores a tu gusto',
    'Código QR listo para imprimir y botón de compartir',
    'Estadísticas de visitas y clicks de todas tus páginas',
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
              href="https://app.minibio.ar/login"
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
                Todos tus links
                <span className="block bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
                  en una sola página
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-purple-200 mb-6 max-w-2xl mx-auto">
                Armá tu página con tus links, tu menú o catálogo, y compartila con un link o un QR. Pensado para emprendedores y negocios.
              </p>

              {/* Aviso gratuito */}
              <div className="inline-flex items-center gap-2 px-5 py-2 mb-10 bg-green-500/20 border border-green-400/40 rounded-full text-green-300 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                100% gratuito mientras está en desarrollo
              </div>

              <div>
                <a
                  href="https://app.minibio.ar/register"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full text-lg font-semibold text-gray-900 hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-pink-500/50"
                >
                  Crear mi página
                  <ArrowRight className="animate-pulse" />
                </a>
              </div>
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
                Qué podés hacer
                <span className="block text-yellow-400">con MiniBio</span>
              </h2>
              <p className="text-xl text-purple-200">
                Sin vueltas: lo que ves es lo que hay, y actualizamos seguido
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

      {/* QR + Share highlight */}
      <div className="relative py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-6 mb-6">
              <QrCode className="w-14 h-14 text-yellow-400" />
              <Share2 className="w-14 h-14 text-pink-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Compartila como quieras
            </h2>
            <p className="text-xl text-purple-200 mb-10 max-w-2xl mx-auto">
              Cada página tiene su código QR para descargar e imprimir, y un botón de compartir. Ideal para la mesa del local o la bio de Instagram.
            </p>
            <a
              href="https://app.minibio.ar/register"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full text-xl font-semibold text-gray-900 hover:scale-105 transform transition-all duration-300 shadow-2xl hover:shadow-pink-500/50"
            >
              Empezar ahora, es gratis
              <ArrowRight className="animate-pulse" />
            </a>
          </div>
        </div>
      </div>

      {/* Sugerencias / Feedback */}
      <div className="relative py-20 bg-black/20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center p-10 bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10">
            <Mail className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Se te ocurre algo para mejorar?
            </h2>
            <p className="text-lg text-purple-200 mb-8">
              MiniBio está en pleno desarrollo y las mejores ideas vienen de quienes lo usan. Si encontraste un error o te gustaría que agreguemos algo, escribinos y lo leemos.
            </p>
            <a
              href="mailto:minibioarg@gmail.com?subject=Sugerencia%20para%20MiniBio"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 border border-white/20 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-300 hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              minibioarg@gmail.com
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
          <p className="text-purple-200 mb-2">
            Gratuito durante el desarrollo · Sugerencias:{' '}
            <a href="mailto:minibioarg@gmail.com" className="font-semibold text-gray-200 hover:underline">
              minibioarg@gmail.com
            </a>
          </p>
          <p className="text-purple-200">
            © 2026 MiniBio.ar · <Link href="/terms" className="font-semibold text-gray-200 hover:underline">Términos y condiciones</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
