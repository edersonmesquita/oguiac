'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconUpload, IconArrowLeft } from '@tabler/icons-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import CompanyLogo from '@/components/CompanyLogo';

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
  categoryId: string;
  category: {
    name: string;
  };
  email?: string;
}

interface Category {
  id: string;
  name: string;
}

export default function EditCompanyProfile() {
  const [company, setCompany] = useState<Company | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('companyToken');
        
        if (!token) {
          router.push('/empresa-login');
          return;
        }

        // Fetch company profile and categories in parallel
        const [companyResponse, categoriesResponse] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`)
        ]);

        if (!companyResponse.ok) {
          throw new Error('Falha ao carregar os dados da empresa');
        }

        if (!categoriesResponse.ok) {
          throw new Error('Falha ao carregar as categorias');
        }

        const [companyData, categoriesData] = await Promise.all([
          companyResponse.json(),
          categoriesResponse.json()
        ]);

        setCompany(companyData);
        setCategories(categoriesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (!company) return;
    
    setCompany({
      ...company,
      [name]: value
    });
  };

  const handleLogoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLogoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!company) return;
    
    setSubmitting(true);
    
    try {
      const token = localStorage.getItem('companyToken');
      
      if (!token) {
        router.push('/empresa-login');
        return;
      }
      
      // Create form data if we have a logo file
      let requestBody;
      let headers: HeadersInit = {
        'Authorization': `Bearer ${token}`
      };
      
      if (logoFile) {
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('data', JSON.stringify({
          name: company.name,
          whatsapp: company.whatsapp,
          address: company.address,
          description: company.description || '',
          instagram: company.instagram || '',
          facebook: company.facebook || '',
          youtube: company.youtube || '',
          website: company.website || '',
          categoryId: company.categoryId
        }));
        
        requestBody = formData;
        // Don't set Content-Type when sending FormData
      } else {
        // No new logo, just send JSON
        requestBody = JSON.stringify({
          name: company.name,
          whatsapp: company.whatsapp,
          address: company.address,
          description: company.description || '',
          instagram: company.instagram || '',
          facebook: company.facebook || '',
          youtube: company.youtube || '',
          website: company.website || '',
          categoryId: company.categoryId
        });
        
        headers['Content-Type'] = 'application/json';
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
        method: 'PUT',
        headers,
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar o perfil');
      }
      
      toast.success('Perfil atualizado com sucesso!');
      router.push('/empresa-dashboard/perfil');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
      toast.error('Erro ao atualizar perfil');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !company) {
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
            Editar Perfil da Empresa
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Atualize os dados da sua empresa no Guia Canindé
          </p>
        </div>
        <Link 
          href="/empresa-dashboard/perfil"
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-md transition-colors"
        >
          <IconArrowLeft size={18} />
          <span>Voltar</span>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo upload section */}
            <div className="w-full md:w-1/4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo da Empresa
              </label>
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 mb-4">
                  {logoPreview ? (
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <CompanyLogo 
                      logo={company.logo} 
                      alt={company.name} 
                      className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
                    />
                  )}
                </div>
                <label className="flex items-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-800/30 text-indigo-600 dark:text-indigo-400 rounded-md cursor-pointer transition-colors">
                  <IconUpload size={18} />
                  <span>Carregar Logo</span>
                  <input 
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Recomendado: 500x500px, JPG ou PNG
                </p>
              </div>
            </div>

            {/* Company info */}
            <div className="w-full md:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={company.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  WhatsApp *
                </label>
                <input
                  type="text"
                  id="whatsapp"
                  name="whatsapp"
                  value={company.whatsapp}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoria *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={company.categoryId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Endereço *
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={company.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={company.description || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Breve descrição sobre sua empresa (máximo 300 caracteres)
                </p>
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Instagram
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={company.instagram || ''}
                  onChange={handleInputChange}
                  placeholder="@seuinstagram ou link completo"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  id="facebook"
                  name="facebook"
                  value={company.facebook || ''}
                  onChange={handleInputChange}
                  placeholder="Link da página"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  YouTube
                </label>
                <input
                  type="text"
                  id="youtube"
                  name="youtube"
                  value={company.youtube || ''}
                  onChange={handleInputChange}
                  placeholder="Link do canal"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  value={company.website || ''}
                  onChange={handleInputChange}
                  placeholder="www.seusite.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-b-0 border-white"></span>
                  <span>Salvando...</span>
                </>
              ) : (
                <span>Salvar Alterações</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 