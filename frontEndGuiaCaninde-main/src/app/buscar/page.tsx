'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { MagnifyingGlassIcon, PhoneIcon, MapPinIcon, StarIcon, AdjustmentsHorizontalIcon, ShareIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { StarRating } from '@/components/StarRating';
import CompanyLogo from '@/components/CompanyLogo';
import { toCompanySlug } from '@/utils/companySlug';
import { getCompanyShareUrl } from '@/utils/shareUrl';

interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
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

export default function BuscarEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [sortByRating, setSortByRating] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, categoriesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
        ]);
        setCompanies(companiesRes.data);
        setFilteredCompanies(companiesRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    let result = companies;
    
    if (selectedCategory) {
      result = result.filter(company => company.category.id === selectedCategory);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(company => 
        company.name.toLowerCase().includes(searchLower) ||
        company.address.toLowerCase().includes(searchLower) ||
        company.category.name.toLowerCase().includes(searchLower)
      );
    }

    if (sortByRating) {
      result = [...result].sort((a, b) => {
        if (!a.totalRatings && !b.totalRatings) return 0;
        if (!a.totalRatings) return 1;
        if (!b.totalRatings) return -1;

        const scoreA = (a.averageRating || 0) * (1 + Math.log10(a.totalRatings || 1));
        const scoreB = (b.averageRating || 0) * (1 + Math.log10(b.totalRatings || 1));

        return scoreB - scoreA;
      });
    } else {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    result = result.slice(0, 15);
    
    setFilteredCompanies(result);
  }, [search, selectedCategory, companies, sortByRating]);
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

  const handleWhatsAppClick = (company: Company) => {
    const formattedNumber = company.whatsapp.replace(/\D/g, '');
    const message = `Olá vim através do OGC - https://oguiacaninde.com.br, gostaria de informações...`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${formattedNumber}?text=${encodedMessage}`, '_blank');
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

  const handleShare = async (company: Company) => {
    const shareText = `Olá vim através do OGC - https://oguiacaninde.com.br, gostaria de informações...`;
    const logoUrl = getAbsoluteLogoUrl(company.logo);

    const shareData = {
      title: company.name,
      url: getCompanyShareUrl(company.id)
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Se não houver suporte ao Web Share API, compartilha diretamente no WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent((logoUrl ? `\nLogo: ${logoUrl}` : ''))}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-6 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4">
            Buscar Empresas
          </h1>
          
          {/* Barra de busca e botão de filtros */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Digite o nome da empresa ou endereço..."
                className="w-full px-4 py-3 pl-12 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-300"
              />
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Mostrar filtros"
            >
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Painel de filtros */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Filtro por categoria */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Todas as categorias</option>
                    {categories.map((category: any) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenação por avaliação */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Ordenação
                  </label>
                  <button
                    onClick={() => setSortByRating(!sortByRating)}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border ${
                      sortByRating
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    } hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors`}
                  >
                    <StarIcon className="w-5 h-5" />
                    <span>Melhores avaliações</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhuma empresa encontrada</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
            {filteredCompanies.map((company) => (
              <Link
                key={company.id}
                href={`/empresas/${toCompanySlug(company.name, company.id)}`}
                className="block bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                    <CompanyLogo 
                      logo={company.logo} 
                      alt={`Logo da ${company.name}`} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <div>
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                          {company.name}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {company.category.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating value={company.averageRating || 0} isReadOnly size={16} />
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({company.totalRatings || 0})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 sm:mt-2">
                          <MapPinIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {company.address}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {company.whatsapp && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleWhatsAppClick(company);
                            }}
                            className="group relative flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                          >
                            <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <PhoneIcon className="w-5 h-5" />
                            <span className="text-sm sm:text-base">WhatsApp</span>
                          </button>
                        )}
                        {company.website && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleWebsiteClick(company.website!);
                            }}
                            className="group relative flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
                          >
                            <div className="absolute inset-0 bg-black/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <line x1="2" y1="12" x2="22" y2="12"></line>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            <span className="text-sm sm:text-base">Visitar Site</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleShare(company);
                          }}
                          className="group relative flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                        >
                          <ShareIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-sm sm:text-base font-medium">Compartilhar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
} 
