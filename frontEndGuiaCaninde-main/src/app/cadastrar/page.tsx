'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios from 'axios';

export default function CadastrarEmpresa() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    street: '',
    number: '',
    neighborhood: '',
    categoryId: '',
    instagram: '',
    facebook: '',
    youtube: '',
    website: '',
    logo: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Iniciando busca de categorias...');
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
        console.log('Categorias recebidas:', response.data);
        setCategories(response.data);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        if (axios.isAxiosError(error)) {
          if (error.code === 'ERR_NETWORK') {
            alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
          } else {
            alert(`Erro ao carregar categorias: ${error.message}`);
          }
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
          method: 'POST',
          body: formDataUpload,
        });

        if (!response.ok) {
          throw new Error('Falha ao fazer upload da imagem');
        }

        const data = await response.json();
        
        // Obtem apenas a URL relativa para salvar no banco (exemplo: /uploads/logo_uuid.jpeg)
        const logoPath = data.url;
        
        // URL completa apenas para exibição no preview
        const previewUrl = data.url.startsWith('http') 
          ? data.url 
          : `${process.env.NEXT_PUBLIC_API_URL}${data.url.startsWith('/') ? '' : '/'}${data.url}`;
        
        console.log('Logo a ser salva no banco:', logoPath);
        console.log('Preview URL:', previewUrl);
        
        setPreviewLogo(previewUrl);
        setFormData({ ...formData, logo: logoPath });
      } catch (error) {
        console.error('Erro ao fazer upload da logo:', error);
        alert('Falha ao fazer upload da imagem. Tente novamente.');
      }
    }
  };

  const formatPhoneNumber = (value: string): string => {
    if (!value) return '';
    
    value = value.replace(/\D/g, '');
    
    if (value.length <= 2) {
      return `(${value}`;
    }
    if (value.length <= 7) {
      return `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      setFormData({ ...formData, whatsapp: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      
      const fullAddress = `${formData.street}, ${formData.number} - ${formData.neighborhood}`;

      const dataToSend = {
        ...formData,
        address: fullAddress,
        instagram: formData.instagram ? `@${formData.instagram}` : '',
        facebook: formData.facebook ? `https://facebook.com/${formData.facebook}` : '',
        youtube: formData.youtube ? `https://youtube.com/@${formData.youtube}` : '',
        website: formData.website || '',
        // Remover campos temporários que não devem ir para a API
        street: undefined,
        number: undefined,
        neighborhood: undefined,
        category: undefined,
      };

      console.log('Dados enviados:', dataToSend);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar dados para o servidor');
      }

      router.push('/buscar');
    } catch (error) {
      console.error('Erro ao cadastrar empresa:', error);
      alert('Erro ao cadastrar empresa');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-primary-50/50 via-white to-green-50/50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Cadastrar Meu Negócio
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Logo da Empresa (Opcional)
              </label>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                  {previewLogo ? (
                    <Image
                      src={previewLogo}
                      alt="Logo Preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="text-sm text-center px-2">Clique para adicionar logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome da Empresa
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Padaria São José"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData({ ...formData, description: e.target.value })
                  }
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                placeholder="Descreva seu negócio em até 300 caracteres"
                rows={4}
                maxLength={300}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {formData.description.length}/300 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp
              </label>
              <input
                type="tel"
                value={formatPhoneNumber(formData.whatsapp)}
                onChange={handlePhoneChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="(85) 99999-9999"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rua
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Rua Principal"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: 123"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Ex: Centro"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Categoria
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}
                </option>
                {categories.map((category: any) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Redes Sociais (Opcional)</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Instagram
              </label>
              <div className="relative flex rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent overflow-hidden">
                <span className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400 text-sm border-r border-gray-300 dark:border-gray-600">
                  @
                </span>
                <input
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value.replace('@', '') })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="seunegocio"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Facebook
              </label>
              <div className="relative flex rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent overflow-hidden">
                <span className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400 text-sm border-r border-gray-300 dark:border-gray-600">
                  facebook.com/
                </span>
                <input
                  type="text"
                  value={formData.facebook}
                  onChange={(e) => setFormData({ ...formData, facebook: e.target.value.replace(/^(https?:\/\/)?(www\.)?(facebook\.com\/)?/, '') })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="seunegocio"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                YouTube
              </label>
              <div className="relative flex rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent overflow-hidden">
                <span className="flex-shrink-0 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-500 dark:text-gray-400 text-sm border-r border-gray-300 dark:border-gray-600">
                  youtube.com/@
                </span>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value.replace(/^(https?:\/\/)?(www\.)?(youtube\.com\/@)?/, '') })}
                  className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                  placeholder="seunegocio"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Website (URL do site - opcional)
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => {
                  setFormData({ ...formData, website: e.target.value });
                }}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="www.seusite.com.br"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Cadastrando...</span>
              </div>
            ) : (
              'Cadastrar Empresa'
            )}
          </button>
        </form>
      </div>
    </main>
  );
} 