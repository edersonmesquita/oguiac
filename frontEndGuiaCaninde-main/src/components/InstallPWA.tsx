'use client';

import { useState, useEffect } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Verifica se o app já está instalado primeiro
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(isStandalone);

    const handler = (e: any) => {
      // Só previne o default se o app não estiver instalado
      if (!isStandalone) {
        console.log('PWA install prompt intercepted, showing custom banner');
        e.preventDefault();
        setSupportsPWA(true);
        setPromptInstall(e);
      } else {
        console.log('PWA already installed, allowing default behavior');
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    if (!promptInstall) {
      console.log('Install prompt not available');
      return;
    }
    
    console.log('Showing install prompt...');
    promptInstall.prompt();
    promptInstall.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
        setIsInstalled(true);
      } else {
        console.log('Usuário recusou a instalação');
      }
    });
  };

  // Se o app já está instalado, não mostra o botão
  if (isInstalled) return null;
  
  // Se PWA é suportado e temos o evento de instalação, mostra o botão
  if (!supportsPWA || !promptInstall) return null;

  return (
    <div className="fixed top-2 right-2 md:top-2 md:right-4 z-50">
      <button
        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white py-1 px-4 rounded-lg shadow-lg transition-transform transform hover:-translate-y-1"
        onClick={onClick}
      >
        <ArrowDownTrayIcon className="h-5 w-5" />
        <span>Instalar App</span>
      </button>
    </div>
  );
} 