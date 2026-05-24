'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { PhoneIcon, MagnifyingGlassIcon, MapPinIcon, ShareIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { StarRating } from '@/components/StarRating';
import CompanyLogo from '@/components/CompanyLogo';
import { toCompanySlug } from '@/utils/companySlug';
import { getCompanyShareUrl } from '@/utils/shareUrl';

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface Company {
  id: string;
  name: string;
  whatsapp: string;
  address: string;
  logo?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  category: {
    id: string;
    name: string;
  };
  averageRating: number;
  totalRatings: number;
}

export default function CategoryPage() {
  const params = useParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, categoryRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/category/${params.id}`),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${params.id}`)
        ]);
        setCompanies(companiesRes.data);
        setFilteredCompanies(companiesRes.data);
        setCategory(categoryRes.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  useEffect(() => {
    if (search) {
      const searchLower = search.toLowerCase();
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchLower) ||
        company.address.toLowerCase().includes(searchLower)
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [search, companies]);

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

  const handleWhatsAppClick = (whatsapp: string) => {
    const formattedNumber = whatsapp.replace(/\D/g, '');
    const message = "Olá vim através do OGC - https://oguiacaninde.com.br, gostaria de informações...";
    window.open(`https://wa.me/55${formattedNumber}?text=${encodeURIComponent(message)}`, '_blank');
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
      text: shareText,
      url: getCompanyShareUrl(company.id)
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Se não houver suporte ao Web Share API, compartilha diretamente no WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + (logoUrl ? `\nLogo: ${logoUrl}` : ''))}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
          <Link
            href="/categorias"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
              ← Voltar para categorias
          </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {category?.name}
            </h1>
            {category?.description && (
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                {category.description}
              </p>
            )}
          </div>
          <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-full px-4 py-2 pl-10 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Nenhuma empresa encontrada nesta categoria
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCompanies.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).map((company) => (
              <Link
                key={company.id}
                href={`/empresas/${toCompanySlug(company.name, company.id)}`}
                className="block bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 w-full max-w-full overflow-hidden"
              >
                <div className="flex gap-3 sm:gap-4 w-full">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex-shrink-0">
                    <CompanyLogo 
                      logo={company.logo} 
                      alt={`Logo da ${company.name}`} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden pr-1">
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <div className="overflow-hidden">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
                          {company.name}
                        </h2>
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
                      <div className="flex flex-wrap gap-2 mt-1">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleWhatsAppClick(company.whatsapp);
                          }}
                          className="group relative flex items-center gap-1 bg-green-500 text-white px-2 py-1.5 rounded-lg hover:bg-green-600 transition-all duration-300 shadow-md"
                        >
                          <PhoneIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">WhatsApp</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleShare(company);
                          }}
                          className="group relative flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                        >
                          <ShareIcon className="w-4 h-4" />
                          <span className="text-sm font-medium">Comp.</span>
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
