'use client';

import { useEffect, useState } from 'react';
import { IconBuildingStore, IconUsers, IconStar, IconPackage } from '@tabler/icons-react';
import Link from 'next/link';

interface Company {
  id: string;
  name: string;
  logo?: string;
  whatsapp: string;
  address: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  youtube?: string;
  website?: string;
  approved: boolean;
  updatedAt: string;
  plan?: {
    id: string;
    name: string;
    description: string;
    price: number;
  };
  category: {
    id: string;
    name: string;
  };
}

export default function CompanyDashboard() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        const token = localStorage.getItem('companyToken');
        if (!token) {
          throw new Error('Não autorizado');
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Falha ao carregar dados');
        }

        const data = await response.json();
        setCompany(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-sm text-red-700 dark:text-red-400">
          {error || 'Não foi possível carregar os dados da empresa'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Dashboard da Empresa
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {company.approved ? 'Aprovado' : 'Pendente'}
              </p>
            </div>
            <div className={`p-3 rounded-full ${company.approved ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
              <IconBuildingStore size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categoria</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {company.category.name}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <IconPackage size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Plano Atual</p>
              <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                {company.plan ? company.plan.name : 'Plano Grátis'}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <IconStar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Company preview */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Prévia da sua empresa
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/4 max-w-[200px] mx-auto md:mx-0">
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <IconBuildingStore size={64} className="text-gray-300 dark:text-gray-600" />
                )}
              </div>
            </div>
            
            <div className="w-full md:w-3/4 space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center md:text-left">
                {company.name}
              </h3>
              
              <p className="text-gray-600 dark:text-gray-300">
                {company.description || 'Sem descrição'}
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">WhatsApp:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{company.whatsapp}</p>
                </div>
                
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Endereço:</p>
                  <p className="font-medium text-gray-900 dark:text-white">{company.address}</p>
                </div>
                
                {company.instagram && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Instagram:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{company.instagram}</p>
                  </div>
                )}
                
                {company.website && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Website:</p>
                    <p className="font-medium text-gray-900 dark:text-white">{company.website}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {new Date(company.updatedAt).toLocaleDateString('pt-BR')}
            </p>
            
            <Link
              href="/empresa-dashboard/perfil"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
            >
              Editar Perfil
            </Link>
          </div>
        </div>
      </div>

      {/* Plan upgrade section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-800 dark:to-purple-900 shadow rounded-lg overflow-hidden">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="text-white">
              <h2 className="text-xl font-semibold">Melhore seu perfil com planos premium</h2>
              <p className="mt-1 text-indigo-100">
                Destaque sua empresa, adicione mais fotos e recursos
              </p>
            </div>
            
            <Link
              href="/empresa-dashboard/planos"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full sm:w-auto justify-center"
            >
              Ver Planos Disponíveis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 