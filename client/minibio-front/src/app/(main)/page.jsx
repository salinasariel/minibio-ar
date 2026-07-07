"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Globe, Share2, QrCode, BarChart3, UtensilsCrossed, Mail } from 'lucide-react';

// Ejemplos que rotan en el mockup del teléfono
const EXAMPLES = [
  {
    name: 'Café Aurora',
    subtitle: 'Café de especialidad · Palermo',
    initial: 'C',
    gradient: 'linear-gradient(160deg, #b45309, #451a03)',
    accent: '#b45309',
    links: ['Nuestra carta', 'Pedinos por WhatsApp', 'Instagram'],
    btnClass: 'rounded-xl bg-white/20 border border-white/30',
  },
  {
    name: 'Barbería Roma',
    subtitle: 'Cortes y barba · Rosario',
    initial: 'B',
    gradient: 'linear-gradient(160deg, #1f2937, #030712)',
    accent: '#1f2937',
    links: ['Turnos por WhatsApp', 'Instagram', 'Cómo llegar'],
    btnClass: 'rounded-lg bg-transparent border-2 border-white/70',
  },
  {
    name: 'La Canchita F5',
    subtitle: 'Fútbol 5 · Córdoba',
    initial: 'L',
    gradient: 'linear-gradient(160deg, #16a34a, #14532d)',
    accent: '#16a34a',
    links: ['Reservá tu cancha', 'WhatsApp', 'Cómo llegar'],
    btnClass: 'rounded-full bg-white/20 border border-white/30',
  },
  {
    name: 'Dulce Lola',
    subtitle: 'Pastelería artesanal · Mendoza',
    initial: 'D',
    gradient: 'linear-gradient(160deg, #db2777, #831843)',
    accent: '#db2777',
    links: ['Catálogo con precios', 'Pedidos por WhatsApp', 'Instagram'],
    btnClass: 'rounded-2xl bg-white/25 border border-white/30',
  },
];

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
  const [example, setExample] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setExample((e) => (e + 1) % EXAMPLES.length);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  const current = EXAMPLES[example];

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
              Login
            </a>
            <a
              href="https://app.minibio.ar/register"
              className="px-4 py-2 text-sm font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Comenzar
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
              <span className="transition-colors duration-700" style={{ color: current.accent }}>
                en una sola página
              </span>
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

          {/* Mockup de teléfono con ejemplos rotativos */}
          <div className="hidden md:flex flex-col items-center gap-5">
            <div className="w-[290px] rounded-[2.4rem] border-[10px] border-gray-900 bg-gray-900 shadow-xl rotate-2">
              <div className="relative rounded-[1.8rem] overflow-hidden h-[430px]">
                {EXAMPLES.map((ex, i) => (
                  <div
                    key={ex.name}
                    className={`absolute inset-0 px-5 pt-10 pb-8 transition-opacity duration-700 ${
                      i === example ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    style={{ background: ex.gradient }}
                  >
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/25 border-2 border-white/50 flex items-center justify-center text-2xl font-bold text-white mb-3">
                      {ex.initial}
                    </div>
                    <p className="text-center text-white font-bold mb-1">{ex.name}</p>
                    <p className="text-center text-white/80 text-xs mb-5">{ex.subtitle}</p>
                    {ex.links.map((t) => (
                      <div
                        key={t}
                        className={`${ex.btnClass} text-center text-white text-sm font-medium py-3 mb-2.5`}
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
                ))}
              </div>
            </div>

            {/* Indicadores */}
            <div className="flex gap-2">
              {EXAMPLES.map((ex, i) => (
                <button
                  key={ex.name}
                  onClick={() => setExample(i)}
                  aria-label={`Ver ejemplo: ${ex.name}`}
                  className="w-2 h-2 rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: i === example ? current.accent : '#d1d5db',
                    transform: i === example ? 'scale(1.4)' : 'scale(1)',
                  }}
                ></button>
              ))}
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

      {/* Planes */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Planes</h2>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Arrancás gratis. Y el Pro no se paga: se consigue invitando.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Gratis */}
          <div className="border border-gray-200 rounded-2xl bg-white p-7 flex flex-col">
            <h3 className="text-xl font-bold mb-1">Gratis</h3>
            <p className="text-gray-500 text-sm mb-6">Todo lo que necesitás para arrancar</p>
            <ul className="space-y-2.5 text-gray-700 mb-8 flex-1">
              {[
                'Hasta 2 páginas',
                'Hasta 10 links por página',
                'Productos con fotos y precios',
                'Botón de WhatsApp',
                'Ubicación y horarios',
                'Estadísticas de visitas y clicks',
                'Código QR y compartir',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://app.minibio.ar/register"
              className="block text-center px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-800 hover:border-gray-900 hover:bg-gray-50 transition-colors"
            >
              Crear mi página
            </a>
          </div>

          {/* Pro */}
          <div className="border-2 border-indigo-600 rounded-2xl bg-white p-7 flex flex-col relative">
            <span className="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white text-xs font-semibold rounded-full">
              Se gana invitando
            </span>
            <h3 className="text-xl font-bold mb-1">Pro</h3>
            <p className="text-gray-500 text-sm mb-6">Todo lo del plan Gratis, más</p>
            <ul className="space-y-2.5 text-gray-700 mb-8 flex-1">
              {[
                'Hasta 5 páginas',
                'Hasta 50 links por página',
                'Datos de pago: alias y MercadoPago',
                'Botón de reseñas de Google',
                'Colores y estilos personalizados',
                'Asistente IA para armar tu página',
              ].map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-1 flex-shrink-0" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 text-sm text-indigo-900">
              <strong>¿Cómo lo consigo?</strong> Invitá a alguien con tu link de referido.
              Cuando su página empiece a recibir clicks, el Pro es tuyo — y se mantiene
              mientras tu referido siga activo.
            </div>
            <a
              href="https://app.minibio.ar/register"
              className="block text-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Empezar e invitar
            </a>
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
          MiniBio está en pleno desarrollo, y las mejores ideas vienen de quienes lo usan. Si encontraste un error o te gustaría que agreguemos algo, escribinos y lo leemos.
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
