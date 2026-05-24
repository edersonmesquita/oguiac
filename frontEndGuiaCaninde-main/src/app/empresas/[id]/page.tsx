'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PhoneIcon, MapPinIcon, ShareIcon, ClipboardDocumentIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { StarRating } from '@/components/StarRating';
import { useAuth } from '@/hooks/useAuth';
import { Metadata } from 'next';
import { extractCompanyIdFromSlug, slugifyCompanyName } from '@/utils/companySlug';
import { getCompanyShareUrl } from '@/utils/shareUrl';
import { sanitizeShareText } from '@/utils/textSanitizer';

interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  description?: string;
  logo?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  category: {
    id: string;
    name: string;
  };
  averageRating: number;
  totalRatings: number;
}

export default function CompanyPage() {
  const params = useParams();
  const rawParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const [companyId, setCompanyId] = useState<string>('');
  const { user } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const [hasRated, setHasRated] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const resolveCompanyId = async () => {
      const param = rawParam || '';
      const extracted = extractCompanyIdFromSlug(param);
      const isUuid = extracted !== param;

      if (isUuid) {
        setCompanyId(extracted);
        return;
      }

      try {
        const listResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`);
        const companies = listResponse.data as Array<{ id: string; name: string }>;
        const found = companies.find((c) => slugifyCompanyName(c.name) === param);
        if (found) setCompanyId(found.id);
      } catch (error) {
        console.error('Erro ao resolver empresa por slug:', error);
      }
    };

    resolveCompanyId();
  }, [rawParam]);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!companyId) return;
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}`);
        setCompany(response.data);

        const ratedCompanies = JSON.parse(localStorage.getItem('ratedCompanies') || '{}');
        if (ratedCompanies[companyId]) {
          setUserRating(ratedCompanies[companyId]);
          setHasRated(true);
        }

        if (user) {
          try {
            const ratingResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/api/ratings/company/${companyId}`,
              {
                headers: {
                  Authorization: `Bearer ${user.token}`
                }
              }
            );
            if (ratingResponse.data.ratings.length > 0) {
              const userRating = ratingResponse.data.ratings.find(
                (r: any) => r.userId === user.id
              );
              if (userRating) {
                setUserRating(userRating.stars);
                setHasRated(true);
              }
            }
          } catch (error) {
            console.error('Error fetching user rating:', error);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [companyId, user]);

  useEffect(() => {
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

    setIsDark(document.documentElement.classList.contains('dark'));

    return () => observer.disconnect();
  }, []);

  const handleRatingChange = async (newRating: number) => {
    if (hasRated) {
      setRatingError('Você já avaliou esta empresa');
      return;
    }

    setIsSubmittingRating(true);
    setRatingError('');

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/ratings`,
        {
          companyId: company?.id,
          stars: newRating,
          userId: user?.id 
        }
      );

      const ratedCompanies = JSON.parse(localStorage.getItem('ratedCompanies') || '{}');
      ratedCompanies[company!.id] = newRating;
      localStorage.setItem('ratedCompanies', JSON.stringify(ratedCompanies));

      setUserRating(newRating);
      setHasRated(true);
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}`);
      setCompany(response.data);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setRatingError('Erro ao enviar avaliação. Tente novamente.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleWhatsAppClick = (whatsapp: string) => {
    const formattedNumber = whatsapp.replace(/\D/g, '');
    const message = "Olá vim através do OGC - https://oguiacaninde.com.br, gostaria de informações...";
    window.open(`https://wa.me/55${formattedNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleWebsiteClick = (website: string) => {
    if (!website) return;
    
    // Check if the URL starts with http:// or https://
    const hasProtocol = /^https?:\/\//i.test(website);
    const url = hasProtocol ? website : `https://${website}`;
    window.open(url, '_blank');
  };

  const getAbsoluteLogoUrl = (logo?: string) => {
    if (!logo) return '';
    return logo.startsWith('http') || logo.startsWith('data:image')
      ? logo
      : `${process.env.NEXT_PUBLIC_API_URL}${logo.startsWith('/') ? '' : '/'}${logo}`;
  };

  const handleShare = async () => {
    if (!company) return;

    const shareUrl = getCompanyShareUrl(company.id);
    const logoUrl = getAbsoluteLogoUrl(company.logo);

    const shareData = {
      title: company.name,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent((logoUrl ? `\nLogo: ${logoUrl}` : ''))}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  const handleWhatsAppGroupPost = () => {
    if (!company) return;
    const shareUrl = getCompanyShareUrl(company.id);
    const cleanName = sanitizeShareText(company.name);
    const message = `*${cleanName}*\nConfira no Guia Canindé:\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Empresa não encontrada</h1>
          <Link href="/categorias" className="text-primary-600 hover:text-primary-700">
            Voltar para categorias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href={`/categorias/${company.category.id}`}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            ← Voltar para {company.category.name}
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
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
                
                {/* Rating Section */}
                <div className="mt-4">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex flex-col items-center sm:items-start">
                      <div className="mb-1">
                        <StarRating
                          value={company.averageRating || 0}
                          isReadOnly
                          size={24}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {company.totalRatings} {company.totalRatings === 1 ? 'avaliação' : 'avaliações'}
                      </p>
                    </div>

                    <div className="sm:border-l sm:pl-4 flex flex-col items-center sm:items-start">
                      <div className="mb-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">Sua avaliação:</p>
                        <StarRating
                          value={userRating}
                          onChange={handleRatingChange}
                          size={24}
                          isReadOnly={hasRated}
                        />
                      </div>
                      {ratingError && (
                        <p className="text-sm text-red-500">{ratingError}</p>
                      )}
                      {isSubmittingRating && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Enviando...
                        </p>
                      )}
                      {hasRated && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Você já avaliou esta empresa
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <button
                  onClick={() => company && handleCopyPhone(company.whatsapp)}
                  className="group relative flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <ClipboardDocumentIcon className="w-5 h-5" />
                  <span className="font-medium">Copiar Número</span>
                </button>
                <button
                  onClick={handleShare}
                  className="group relative flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                >
                  <ShareIcon className="w-5 h-5" />
                  <span className="font-medium">Compartilhar</span>
                </button>
                <button
                  onClick={handleWhatsAppGroupPost}
                  className="group relative flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-4 py-2 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-all duration-300"
                >
                  <PhoneIcon className="w-5 h-5" />
                  <span className="font-medium">Postar em Grupo</span>
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
                    <span className="font-medium">Seguir no Instagram</span>
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
                    <span className="font-medium">Seguir no Facebook</span>
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
                    <span className="font-medium">Ver no YouTube</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast de copiado */}
      {showCopiedToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg shadow-lg">
          Copiado com sucesso!
        </div>
      )}
    </main>
  );
} 

