'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MagnifyingGlassIcon, BuildingStorefrontIcon } from '@heroicons/react/24/solid';
import { useState, useEffect } from 'react';

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Observe changes to the dark class on the html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlElement = document.documentElement;
          setIsDark(htmlElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Initial check
    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center mb-12">
          <div className="animate-fade-in order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Encontre tudo em Canindé
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Conecte-se diretamente com empresas e profissionais da sua cidade. Rápido, fácil e gratuito!
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/buscar"
                className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden dark:shadow-primary-500/20"
              >
                <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                <MagnifyingGlassIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-medium">O que está buscando?</span>
              </Link>
              
              <Link
                href="/cadastrar"
                className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden dark:shadow-secondary-500/20"
              >
                <div className="absolute inset-0 bg-white/10 group-hover:bg-transparent transition-colors" />
                <BuildingStorefrontIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                <span className="text-lg font-medium">Cadastrar Meu Negócio</span>
              </Link>
            </div>
          </div>

          <div className="animate-fade-in order-1 md:order-2">
            <div className="relative w-full aspect-[16/9] max-w-lg mx-auto">
              <div className="absolute inset-0 " />
              <img
                src={isDark ? '/LOGO-BR.png' : '/LOGO-BG.png'}
                alt="Guia Canindé"
                className="p-4 absolute inset-0 w-full h-full object-contain"
                style={{ objectFit: 'contain' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.endsWith('/ICONETESTE.png')) {
                    target.src = '/ICONETESTE.png';
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div className="animate-slide-up text-center space-y-8 mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent drop-shadow-sm">
            Como funciona?
          </h2>

          {/* Cards com recursos */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mb-4 mx-auto bg-primary-100 dark:bg-primary-900/50 rounded-xl">
                <MagnifyingGlassIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                <span className="font-semibold text-primary-600 dark:text-primary-400">100% gratuito!</span> Conecte-se diretamente pelo WhatsApp com empresas e profissionais.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 mb-4 mx-auto bg-secondary-100 dark:bg-secondary-900/50 rounded-xl">
                <BuildingStorefrontIcon className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <p className="text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                Encontre serviços próximos a você: pizzarias, encanadores, cabeleireiros e muito mais!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Encontre o que precisa em Canindé</p>
          <p className="mt-1">Rápido, fácil e direto no WhatsApp</p>
        </div>
      </div>

    </main>
  );
} 