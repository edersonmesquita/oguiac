'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIcon, MapPinIcon, ShareIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { IconEdit, IconBrandInstagram, IconBrandFacebook, IconBrandYoutube, IconWorld } from '@tabler/icons-react';

interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  logo?: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  category: {
    name: string;
  };
  email?: string;
}

export default function CompanyProfile() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchCompanyProfile = async () => {
      try {
        const token = localStorage.getItem('companyToken');
        
        if (!token) {
          router.push('/empresa-login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar os dados da empresa');
        }

        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Error fetching company profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyProfile();
  }, [router]);

  const handleWebsiteClick = (website: string) => {
    if (!website) return;
    
    // Check if the URL starts with http:// or https://
    const hasProtocol = /^https?:\/\//i.test(website);
    const url = hasProtocol ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  const handleWhatsAppClick = (whatsapp: string) => {
    const formattedNumber = whatsapp.replace(/\D/g, '');
    const message = "Olá vim através do OGC - https://oguiacaninde.com.br, gostaria de informações...";
    window.open(`https://wa.me/55${formattedNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCopyPhone = async (whatsapp: string) => {
    try {
      await navigator.clipboard.writeText(whatsapp);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar número:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
        <h2 className="text-red-600 dark:text-red-400 text-xl font-semibold">Erro</h2>
        <p className="mt-2 text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
        <h2 className="text-yellow-600 dark:text-yellow-400 text-xl font-semibold">Dados não encontrados</h2>
        <p className="mt-2 text-yellow-600 dark:text-yellow-400">
          Não foi possível carregar os dados da sua empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Perfil da Empresa
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Visualize os dados cadastrados da sua empresa no Guia Canindé
          </p>
        </div>
        <Link 
          href="/empresa-dashboard/perfil/editar"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
        >
          <IconEdit size={18} />
          <span>Editar Perfil</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header com logo e informações principais */}
        <div className="relative h-48 bg-gradient-to-r from-primary-500 to-secondary-500">
          <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 sm:left-6 sm:transform-none w-32 h-32 rounded-xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg bg-white dark:bg-gray-800">
            <img
              src={company.logo
                ? (company.logo.startsWith('http') || company.logo.startsWith('data:image')
                    ? company.logo
                    : `${process.env.NEXT_PUBLIC_API_URL}${company.logo.startsWith('/') ? '' : '/'}${company.logo}`)
                : '/ICONETESTE.png'}
              alt={company.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.endsWith('/ICONETESTE.png')) {
                  target.src = '/ICONETESTE.png';
                }
              }}
            />
          </div>
        </div>

        <div className="p-6 pt-20 sm:pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-center sm:text-left sm:ml-36">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{company.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{company.category.name}</p>
              
              {company.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm">
                  {company.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
              <button
                onClick={() => company && handleCopyPhone(company.whatsapp)}
                className="group relative flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
              >
                <ClipboardDocumentIcon className="w-5 h-5" />
                <span className="font-medium">Copiar Número</span>
              </button>
            </div>
          </div>

          {/* Endereço */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Localização</h2>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <MapPinIcon className="w-6 h-6 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">Endereço</p>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">{company.address}</p>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${company.address}, Canindé, CE`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-md w-full sm:w-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="font-medium">Ver no Maps</span>
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp / Contato Button */}
          <div className="flex flex-col gap-5 mt-10 w-full">
            {company.whatsapp && (
              <button
                onClick={() => handleWhatsAppClick(company.whatsapp)}
                className="flex items-center justify-center gap-4 w-full bg-green-500 hover:bg-green-600 text-white px-8 py-5 rounded-xl transition-colors shadow-lg hover:shadow-xl text-xl font-semibold transform hover:-translate-y-1"
              >
                <PhoneIcon className="w-8 h-8" />
                <span>WhatsApp</span>
              </button>
            )}
            {company.website && (
              <button
                onClick={() => handleWebsiteClick(company.website!)}
                className="flex items-center justify-center gap-4 w-full bg-blue-500 hover:bg-blue-600 text-white px-8 py-5 rounded-xl transition-colors shadow-lg hover:shadow-xl text-xl font-semibold transform hover:-translate-y-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <span>Visitar Site</span>
              </button>
            )}
          </div>

          {/* Social Media Links */}
          {(company.instagram || company.facebook || company.youtube) && (
            <div className="mt-8 flex flex-col gap-3">
              {company.instagram && (
                <a
                  href={`https://instagram.com/${company.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span className="font-medium">Perfil no Instagram</span>
                </a>
              )}
              {company.facebook && (
                <a
                  href={company.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="font-medium">Página no Facebook</span>
                </a>
              )}
              {company.youtube && (
                <a
                  href={company.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span className="font-medium">Canal no YouTube</span>
                </a>
              )}
            </div>
          )}

          {/* Premium features - locked state */}
          <div className="mt-10 space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Recursos Premium
              </h2>
              <Link
                href="/empresa-dashboard/planos"
                className="text-sm font-medium text-amber-600 dark:text-amber-500 hover:text-amber-700 dark:hover:text-amber-400 flex items-center gap-1"
              >
                Ver todos os planos
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            <div className="text-center mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800/30">
              <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                Os recursos premium estarão disponíveis em breve!
              </p>
            </div>

            {/* Image Gallery - Available in Basic Plan (3 photos), Pro Plan (unlimited) */}
            <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 overflow-hidden border border-amber-100 dark:border-amber-900/50 transform transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 dark:bg-black/40 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl text-center w-[90%] max-w-sm transform transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-500 mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mt-2 sm:mt-3 text-gray-900 dark:text-white">Galeria de Imagens</h3>
                  <div className="w-12 h-1 bg-amber-500 mx-auto my-2 sm:my-3"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Destaque seu negócio com até 3 fotos no Plano Básico (R$10/mês) ou galeria com até 20 fotos no Plano Pro (R$20/mês).
                  </p>
                  <Link href="/empresa-dashboard/planos" className="mt-4 sm:mt-6 inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    Fazer Upgrade
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    Em breve disponível para contratação
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-amber-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Galeria de Imagens</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-2 opacity-80 blur-[1px]">
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-700/30 dark:to-amber-800/30 rounded-lg overflow-hidden shadow-sm"></div>
                  <div className="aspect-square bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-800/30 dark:to-amber-700/30 rounded-lg overflow-hidden shadow-sm"></div>
                  <div className="aspect-square bg-gradient-to-br from-amber-100 to-amber-300 dark:from-amber-700/30 dark:to-amber-900/30 rounded-lg overflow-hidden shadow-sm"></div>
                  <div className="aspect-square bg-gradient-to-br from-amber-300 to-amber-100 dark:from-amber-900/30 dark:to-amber-700/30 rounded-lg overflow-hidden shadow-sm"></div>
                </div>
              </div>
            </div>

            {/* Products/Services Showcase - Available in Pro Plan */}
            <div className="relative bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 overflow-hidden border border-emerald-100 dark:border-emerald-900/50 transform transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 dark:bg-black/40 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl text-center w-[90%] max-w-sm transform transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-500 mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mt-2 sm:mt-3 text-gray-900 dark:text-white">Produtos e Serviços</h3>
                  <div className="w-12 h-1 bg-emerald-500 mx-auto my-2 sm:my-3"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Destaque seus melhores produtos e serviços com imagens e descrições. Disponível no Plano Pro (R$20/mês).
                  </p>
                  <Link href="/empresa-dashboard/planos" className="mt-4 sm:mt-6 inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    Fazer Upgrade Pro
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    Em breve disponível para contratação
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-emerald-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Produtos e Serviços</h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4 opacity-80 blur-[1px]">
                  <div className="border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3 sm:p-4 bg-white/80 dark:bg-gray-700/50">
                    <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-700/30 dark:to-emerald-800/30 rounded-lg mb-3"></div>
                    <div className="h-4 bg-emerald-100 dark:bg-emerald-700/30 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-emerald-50 dark:bg-emerald-700/20 rounded w-5/6"></div>
                  </div>
                  <div className="border border-emerald-200 dark:border-emerald-700/50 rounded-lg p-3 sm:p-4 bg-white/80 dark:bg-gray-700/50">
                    <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-emerald-200 to-emerald-100 dark:from-emerald-800/30 dark:to-emerald-700/30 rounded-lg mb-3"></div>
                    <div className="h-4 bg-emerald-100 dark:bg-emerald-700/30 rounded w-2/3 mb-2"></div>
                    <div className="h-3 bg-emerald-50 dark:bg-emerald-700/20 rounded w-4/5"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Video Showcase - Available in Pro Plan */}
            <div className="relative bg-gradient-to-r from-purple-50 to-violet-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 overflow-hidden border border-purple-100 dark:border-purple-900/50 transform transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 dark:bg-black/40 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl text-center w-[90%] max-w-xs sm:max-w-sm transform transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-500 mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mt-2 sm:mt-3 text-gray-900 dark:text-white">Vídeo Promocional</h3>
                  <div className="w-12 h-1 bg-purple-500 mx-auto my-2 sm:my-3"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Adicione um vídeo promocional para destacar sua empresa. Disponível no Plano Pro.
                  </p>
                  <Link href="/empresa-dashboard/planos" className="mt-4 sm:mt-6 inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    Fazer Upgrade Pro
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    Em breve disponível para contratação
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-purple-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vídeo Promocional</h3>
                </div>
                
                <div className="w-full h-56 sm:h-64 md:h-72 bg-gradient-to-br from-purple-100 to-violet-200 dark:from-purple-900/20 dark:to-violet-800/20 rounded-lg flex items-center justify-center opacity-80 blur-[1px] shadow-sm">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 dark:bg-black/30 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours - Available in Basic Plan */}
            <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 sm:p-6 overflow-hidden border border-blue-100 dark:border-blue-900/50 transform transition-all duration-300 hover:shadow-lg">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/40 dark:bg-black/40 flex items-center justify-center z-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 shadow-xl text-center w-[90%] max-w-xs sm:max-w-sm transform transition-all duration-300 hover:scale-105">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mb-3 sm:mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold mt-2 sm:mt-3 text-gray-900 dark:text-white">Horário de Funcionamento</h3>
                  <div className="w-12 h-1 bg-blue-500 mx-auto my-2 sm:my-3"></div>
                  <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-300">
                    Informe aos clientes quando sua empresa está aberta. Disponível no Plano Básico.
                  </p>
                  <Link href="/empresa-dashboard/planos" className="mt-4 sm:mt-6 inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm sm:text-base font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    Fazer Upgrade
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                  <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                    Em breve disponível para contratação
                  </p>
                </div>
              </div>
              <div className="flex flex-col space-y-3">
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Horário de Funcionamento</h3>
                </div>
                
                <div className="space-y-2 opacity-80 blur-[1px]">
                  <div className="flex justify-between p-3 rounded-lg bg-white/80 dark:bg-gray-700/50">
                    <span className="font-medium text-sm sm:text-base">Segunda-feira</span>
                    <span className="text-sm sm:text-base">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-700/30">
                    <span className="font-medium text-sm sm:text-base">Terça-feira</span>
                    <span className="text-sm sm:text-base">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-white/80 dark:bg-gray-700/50">
                    <span className="font-medium text-sm sm:text-base">Quarta-feira</span>
                    <span className="text-sm sm:text-base">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-white/50 dark:bg-gray-700/30">
                    <span className="font-medium text-sm sm:text-base">Quinta-feira</span>
                    <span className="text-sm sm:text-base">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-white/80 dark:bg-gray-700/50">
                    <span className="font-medium text-sm sm:text-base">Sexta-feira</span>
                    <span className="text-sm sm:text-base">08:00 - 18:00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast de copiado */}
      {showCopiedToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg">
          Copiado com sucesso!
        </div>
      )}
    </div>
  );
} 
