import { Fragment, useEffect, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { IconX } from '@tabler/icons-react';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
}

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
  categoryId: string;
  approved: boolean;
  category?: Category;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Company>) => void;
  company: Company | null;
  categories: Category[];
}

export default function CompanyEditModal({ isOpen, onClose, onSave, company, categories }: Props) {
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    whatsapp: '',
    address: '',
    description: '',
    instagram: '',
    facebook: '',
    youtube: '',
    website: '',
    categoryId: '',
    logo: '',
  });
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);

  useEffect(() => {
    if (company) {
      console.log('Loading company data into form:', {
        websiteValue: company.website,
        allValues: company
      });
      
      setFormData({
        name: company.name,
        whatsapp: company.whatsapp,
        address: company.address,
        description: company.description || '',
        instagram: company.instagram || '',
        facebook: company.facebook || '',
        youtube: company.youtube || '',
        website: company.website || '',
        categoryId: company.category?.id || company.categoryId,
        logo: company.logo || '',
      });
      setPreviewLogo(company.logo || null);
    }
  }, [company]);

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
          throw new Error('Falha no upload');
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
        setFormData(prev => ({ ...prev, logo: logoPath }));
      } catch (error: any) {
        console.error('Erro detalhado no upload:', {
          mensagem: error.message,
          stack: error.stack
        });
        alert(`Erro no upload: ${error.message}`);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSubmit = { ...formData };
    
    if (dataToSubmit.logo === '') {
      delete dataToSubmit.logo;
    }
    
    console.log('Dados enviados:', dataToSubmit);
    onSave(dataToSubmit);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-lg font-medium text-gray-900 dark:text-white">
                    Editar Empresa
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Logo da Empresa (Opcional)
                    </label>
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-500 dark:hover:border-primary-400 transition-colors">
                        {previewLogo ? (
                          <img
                            src={previewLogo ? (previewLogo.startsWith('http') || previewLogo.startsWith('data:image')
                              ? previewLogo
                              : `${process.env.NEXT_PUBLIC_API_URL}${previewLogo.startsWith('/') ? '' : '/'}${previewLogo}`)
                              : '/ICONETESTE.png'}
                            alt="Logo Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              if (!target.src.endsWith('/ICONETESTE.png')) {
                                target.src = '/ICONETESTE.png';
                              }
                            }}
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
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formatPhoneNumber(formData.whatsapp || '')}
                      onChange={handlePhoneChange}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      placeholder="Descreva a empresa em até 300 caracteres"
                      rows={4}
                      maxLength={300}
                    />
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {(formData.description?.length || 0)}/300 caracteres
                    </p>
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
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      Redes Sociais (Opcional)
                    </h4>

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
                          value={formData.instagram?.replace('@', '') || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace('@', '');
                            setFormData({ ...formData, instagram: value });
                          }}
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
                          value={formData.facebook?.replace(/^(https?:\/\/)?(www\.)?(facebook\.com\/)?/, '') || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/^(https?:\/\/)?(www\.)?(facebook\.com\/)?/, '');
                            setFormData({ ...formData, facebook: value });
                          }}
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
                          value={formData.youtube?.replace(/^(https?:\/\/)?(www\.)?(youtube\.com\/@)?/, '') || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/^(https?:\/\/)?(www\.)?(youtube\.com\/@)?/, '');
                            setFormData({ ...formData, youtube: value });
                          }}
                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
                          placeholder="seunegocio"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Website (URL do site - opcional)
                    </label>
                    <input
                      type="text"
                      value={formData.website || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, website: e.target.value });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="www.seusite.com.br"
                    />
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 