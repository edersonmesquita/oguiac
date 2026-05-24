'use client';

import { useState, useEffect } from 'react';
import { IconLock, IconLockOpen, IconTrash, IconCategory, IconEdit, IconKey } from '@tabler/icons-react';
import ConfirmationModal from '@/components/ConfirmationModal';
import CategorySelectModal from '@/components/CategorySelectModal';
import CompanyEditModal from '@/components/CompanyEditModal';
import Image from 'next/image';
import CompanyLogo from '@/components/CompanyLogo';
import { toast } from 'react-hot-toast';
import CredentialModal from '../../../components/CredentialModal';

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
  approved: boolean;
  category: {
    id: string;
    name: string;
  };
  categoryId: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
}

export default function AdminEmpresas() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [credentialModalOpen, setCredentialModalOpen] = useState(false);
  const [companyForCredentials, setCompanyForCredentials] = useState<Company | null>(null);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchCategories();

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
  }, [page, search]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    }
  };

  const fetchCompanies = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/empresas?page=${page}&limit=10${searchParam}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar empresas');
      }

      const data = await response.json();
      setCompanies(data.empresas);
      setTotalPages(data.pagination.pages);
      setSelectedCompanyIds([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/empresas/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar status da empresa');
      }

      setCompanies(companies.map(company => 
        company.id === id ? { ...company, approved: !currentStatus } : company
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status');
    }
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir empresa');
      }

      fetchCompanies();
      setDeleteModalOpen(false);
      setCompanyToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir empresa');
    }
  };

  const toggleSelectCompany = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedCompanyIds.length === companies.length) {
      setSelectedCompanyIds([]);
      return;
    }
    setSelectedCompanyIds(companies.map((company) => company.id));
  };

  const handleBulkDelete = async () => {
    if (selectedCompanyIds.length === 0) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token nÃ£o encontrado');
        return;
      }

      await Promise.all(
        selectedCompanyIds.map((id) =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
        )
      );

      toast.success(`${selectedCompanyIds.length} empresa(s) excluÃ­da(s) com sucesso`);
      setBulkDeleteModalOpen(false);
      setSelectedCompanyIds([]);
      fetchCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir empresas');
      toast.error('Erro ao excluir empresas selecionadas');
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    if (!selectedCompany) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${selectedCompany.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categoryId }),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar categoria da empresa');
      }

      fetchCompanies();
      setCategoryModalOpen(false);
      setSelectedCompany(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar categoria');
    }
  };

  const handleEditClick = async (company: Company) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }
      const data = await response.json();
      setCategories(data);
      setCompanyToEdit(company);
      setEditModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar categorias');
    }
  };

  const handleSaveEdit = async (data: Partial<Company>) => {
    if (!companyToEdit) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyToEdit.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar empresa');
      }

      fetchCompanies();
      setEditModalOpen(false);
      setCompanyToEdit(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar empresa');
    }
  };

  const handleCredentialClick = (company: Company) => {
    setCompanyForCredentials(company);
    setCredentialModalOpen(true);
  };

  const handleGenerateCredentials = async (email: string, password: string) => {
    if (!companyForCredentials) return;

    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('Token não encontrado');
        return;
      }

      // If password is empty and we're updating existing credentials, don't include it in the request
      const requestBody = password 
        ? { email, password } 
        : { email };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/empresas/${companyForCredentials.id}/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar credenciais');
      }

      toast.success('Credenciais atualizadas com sucesso!');
      setCredentialModalOpen(false);
      setCompanyForCredentials(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar credenciais');
      toast.error('Erro ao gerar credenciais');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Empresas
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gerencie as empresas cadastradas no Guia Comercial
          </p>
        </div>
        {selectedCompanyIds.length > 0 && (
          <button
            onClick={() => setBulkDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
          >
            <IconTrash className="w-4 h-4" />
            Apagar selecionadas ({selectedCompanyIds.length})
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar empresas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="block lg:hidden space-y-4">
            {companies.map((company) => (
              <div
                key={company.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
              >
                <div className="flex gap-4">
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.includes(company.id)}
                    onChange={() => toggleSelectCompany(company.id)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="w-20 h-20 flex-shrink-0">
                    <CompanyLogo 
                      logo={company.logo} 
                      alt={company.name} 
                      className="w-full h-full" 
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {company.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {company.category?.name || 'Sem categoria'}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>WhatsApp: {company.whatsapp}</p>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleToggleStatus(company.id, company.approved)}
                    className={`p-2 rounded-lg ${
                      company.approved
                        ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                    title={company.approved ? 'Bloquear empresa' : 'Liberar empresa'}
                  >
                    {company.approved ? (
                      <IconLock className="w-5 h-5" />
                    ) : (
                      <IconLockOpen className="w-5 h-5" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCompany(company);
                      setCategoryModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    title="Trocar categoria"
                  >
                    <IconCategory className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEditClick(company)}
                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    title="Editar empresa"
                  >
                    <IconEdit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(company)}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Excluir empresa"
                  >
                    <IconTrash className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleCredentialClick(company)}
                    className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    title="Gerar credenciais de acesso"
                  >
                    <IconKey size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={companies.length > 0 && selectedCompanyIds.length === companies.length}
                        onChange={handleToggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {companies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedCompanyIds.includes(company.id)}
                          onChange={() => toggleSelectCompany(company.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 flex-shrink-0">
                            <CompanyLogo 
                              logo={company.logo} 
                              alt={company.name} 
                              className="w-full h-full" 
                            />
                          </div>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {company.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {company.category?.name || 'Sem categoria'}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {company.whatsapp}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.approved
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {company.approved ? 'Liberada' : 'Bloqueada'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleToggleStatus(company.id, company.approved)}
                          className={`${
                            company.approved
                              ? 'text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300'
                              : 'text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300'
                          } mr-3`}
                          title={company.approved ? 'Bloquear empresa' : 'Liberar empresa'}
                        >
                          {company.approved ? (
                            <IconLock className="w-5 h-5" />
                          ) : (
                            <IconLockOpen className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCompany(company);
                            setCategoryModalOpen(true);
                          }}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                          title="Trocar categoria"
                        >
                          <IconCategory className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(company)}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                          title="Editar empresa"
                        >
                          <IconEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleCredentialClick(company)}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                          title="Gerar credenciais de acesso"
                        >
                          <IconKey size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(company)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mr-3"
                          title="Excluir empresa"
                        >
                          <IconTrash className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Página {page} de {totalPages}
            </span>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCompanyToDelete(null);
        }}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir a empresa "${companyToDelete?.name}"? Esta ação não pode ser desfeita.`}
        actions={[
          {
            text: 'Cancelar',
            onClick: () => {
              setDeleteModalOpen(false);
              setCompanyToDelete(null);
            },
            variant: 'secondary'
          },
          {
            text: 'Excluir',
            onClick: handleDelete,
            variant: 'danger'
          }
        ]}
      />

      <ConfirmationModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title="Excluir Empresas Selecionadas"
        message={`Tem certeza que deseja excluir ${selectedCompanyIds.length} empresa(s)? Esta ação não pode ser desfeita.`}
        actions={[
          {
            text: 'Cancelar',
            onClick: () => setBulkDeleteModalOpen(false),
            variant: 'secondary'
          },
          {
            text: 'Excluir Selecionadas',
            onClick: handleBulkDelete,
            variant: 'danger'
          }
        ]}
      />

      {/* Category Select Modal */}
      {selectedCompany && (
        <CategorySelectModal
          isOpen={categoryModalOpen}
          onClose={() => {
            setCategoryModalOpen(false);
            setSelectedCompany(null);
          }}
          onSelect={handleCategoryChange}
          currentCategoryId={selectedCompany.category?.id}
          title={`Alterar categoria de ${selectedCompany.name}`}
        />
      )}

      {/* Edit Company Modal */}
      {companyToEdit && (
        <CompanyEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setCompanyToEdit(null);
          }}
          onSave={handleSaveEdit}
          company={companyToEdit}
          categories={categories}
        />
      )}

      {credentialModalOpen && (
        <CredentialModal
          isOpen={credentialModalOpen}
          onClose={() => setCredentialModalOpen(false)}
          onSubmit={handleGenerateCredentials}
          company={companyForCredentials}
        />
      )}
    </div>
  );
} 
