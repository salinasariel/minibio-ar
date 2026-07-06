"use client";
import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Globe, Share2, QrCode, BarChart3, UtensilsCrossed, Mail } from 'lucide-react';

const features = [
  { icon: Globe, title: 'Tu página con tu nombre', desc: 'tunegocio.minibio.ar con todos tus links en un solo lugar' },
  { icon: UtensilsCrossed, title: 'Menú con fotos y precios', desc: 'Cargá tus productos o tu carta' },
  { icon: BarChart3, title: 'Estadísticas', desc: 'Visitas, clicks por link y actividad de los últimos días' },
];

const benefits = [
  'Tu dirección propia: elegís el nombre de tu página',
  'Menú o catálogo con fotos, precios y descripciones',
  'Foto de perfil y colores a tu gusto',
  'Código QR listo para imprimir y botón de compartir',
  'Estadísticas de visitas y clicks de todas tus páginas',
];

export default function MiniBioLanding() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-gray-900 antialiased">
      {/* Nav */}
      <nav className="border-b border-gray-200/70 bg-[#fafaf8]/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            minibio<span className="text-indigo-600">.ar</span>
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://app.minibio.ar/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Iniciar Sesión
            </a>
            <a
              href="https://app.minibio.ar/register"
              className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Crear mi página
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-6">
              <CheckCircle className="w-4 h-4" />
              100% gratuito mientras está en desarrollo
            </p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
              Todos tus links
              <br />
              <span className="text-indigo-600">en una sola página</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed mb-8 max-w-md">
              Armá tu página con tus links, tu menú o catálogo, y compartila con un link o un QR. Pensado para emprendedores y negocios.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://app.minibio.ar/register"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Crear mi página
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://app.minibio.ar/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 underline underline-offset-4 transition-colors"
              >
                Ya tengo cuenta
              </a>
            </div>
          </div>

          {/* Mockup de teléfono */}
          <div className="hidden md:flex justify-center">
            <div className="w-[290px] rounded-[2.4rem] border-[10px] border-gray-900 bg-gray-900 shadow-xl rotate-2">
              <div className="rounded-[1.8rem] overflow-hidden bg-gradient-to-b from-indigo-500 to-violet-600 px-5 pt-10 pb-8">
                <div className="w-16 h-16 mx-auto rounded-full bg-white/25 border-2 border-white/50 flex items-center justify-center text-2xl font-bold text-white mb-3">
                  L
                </div>
                <p className="text-center text-white font-bold mb-1">Lo de Lucas</p>
                <p className="text-center text-white/80 text-xs mb-5">Café de especialidad · Palermo</p>
                {['Nuestra carta', 'Pedinos por WhatsApp', 'Instagram'].map((t) => (
                  <div
                    key={t}
                    className="bg-white/20 border border-white/30 rounded-xl text-center text-white text-sm font-medium py-3 mb-2.5"
                  >
                    {t}
                  </div>
                ))}
                <div className="flex justify-center gap-3 mt-5">
                  <div className="w-9 h-9 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-white" />
                  </div>
                  <div className="w-9 h-9 bg-white/20 border border-white/30 rounded-lg flex items-center justify-center">
                    <Share2 className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="border-y border-gray-200/70 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-10">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon className="w-6 h-6 text-indigo-600 mb-3" strokeWidth={1.8} />
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Qué podés hacer */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="grid md:grid-cols-[1fr_1.4fr] gap-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Qué podés hacer con MiniBio
            </h2>
            <p className="text-gray-600 text-lg">
              Sin vueltas: lo que ves es lo que hay, y actualizamos seguido.
            </p>
          </div>
          <ol className="space-y-0 divide-y divide-gray-200/70">
            {benefits.map((b, i) => (
              <li key={b} className="flex items-baseline gap-4 py-4">
                <span className="text-sm font-mono text-indigo-600 tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-gray-800 text-lg">{b}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* QR + compartir */}
      <section className="border-y border-gray-200/70 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Compartila como quieras
            </h2>
            <p className="text-gray-300 text-lg leading-relaxed mb-8">
              Cada página tiene su código QR para descargar e imprimir, y un botón de compartir. Ideal para la mesa del local o la bio de Instagram.
            </p>
            <a
              href="https://app.minibio.ar/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
            >
              Empezar ahora, es gratis
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          <div className="flex justify-center gap-6">
            <div className="w-32 h-32 bg-white rounded-2xl p-3 rotate-[-3deg]">
              {/* QR ilustrativo */}
              <svg viewBox="0 0 100 100" className="w-full h-full text-gray-900" fill="currentColor">
                <rect x="8" y="8" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="17" y="17" width="8" height="8" />
                <rect x="66" y="8" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="75" y="17" width="8" height="8" />
                <rect x="8" y="66" width="26" height="26" rx="3" fill="none" stroke="currentColor" strokeWidth="6" />
                <rect x="17" y="75" width="8" height="8" />
                <rect x="45" y="8" width="8" height="8" /><rect x="45" y="24" width="8" height="8" />
                <rect x="8" y="45" width="8" height="8" /><rect x="24" y="45" width="8" height="8" />
                <rect x="45" y="45" width="8" height="8" /><rect x="61" y="45" width="8" height="8" />
                <rect x="84" y="45" width="8" height="8" /><rect x="45" y="61" width="8" height="8" />
                <rect x="66" y="66" width="8" height="8" /><rect x="84" y="66" width="8" height="8" />
                <rect x="45" y="84" width="8" height="8" /><rect x="66" y="84" width="8" height="8" />
                <rect x="84" y="84" width="8" height="8" />
              </svg>
            </div>
            <div className="w-32 h-32 bg-emerald-500 rounded-2xl rotate-3 flex items-center justify-center">
              <Share2 className="w-12 h-12 text-white" strokeWidth={1.6} />
            </div>
          </div>
        </div>
      </section>

      {/* Sugerencias */}
      <section className="max-w-3xl mx-auto px-6 py-20 md:py-24 text-center">
        <Mail className="w-8 h-8 text-indigo-600 mx-auto mb-4" strokeWidth={1.8} />
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
          ¿Se te ocurre algo para mejorar?
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-8">
          MiniBio está en pleno desarrollo y las mejores ideas vienen de quienes lo usan. Si encontraste un error o te gustaría que agreguemos algo, escribinos y lo leemos.
        </p>
        <a
          href="mailto:minibioarg@gmail.com?subject=Sugerencia%20para%20MiniBio"
          className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Mail className="w-4 h-4" />
          minibioarg@gmail.com
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/70">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <span className="font-bold text-gray-900 text-base">
            minibio<span className="text-indigo-600">.ar</span>
          </span>
          <p>
            Gratuito durante el desarrollo · Sugerencias:{' '}
            <a href="mailto:minibioarg@gmail.com" className="font-medium text-gray-700 hover:underline">
              minibioarg@gmail.com
            </a>
          </p>
          <p>
            © 2026 MiniBio.ar ·{' '}
            <Link href="/terms" className="font-medium text-gray-700 hover:underline">
              Términos y condiciones
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
