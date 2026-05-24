'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { IconBuilding, IconCategory, IconLock, IconCheck } from '@tabler/icons-react';

interface DashboardStats {
  totalEmpresas: number;
  totalCategorias: number;
  empresasLiberadas: number;
  empresasBloqueadas: number;
}

interface RecentCompany {
  id: string;
  nome: string;
  categoria: string;
  aprovado: boolean;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmpresas: 0,
    totalCategorias: 0,
    empresasLiberadas: 0,
    empresasBloqueadas: 0,
  });
  const [recentCompanies, setRecentCompanies] = useState<RecentCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.status === 401 || statsResponse.status === 403) {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
          return;
        }

        if (!statsResponse.ok) {
          throw new Error('Erro ao buscar estatisticas');
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

        const companiesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/empresas/recent`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (companiesResponse.status === 401 || companiesResponse.status === 403) {
          localStorage.removeItem('adminToken');
          router.push('/admin/login');
          return;
        }

        if (!companiesResponse.ok) {
          throw new Error('Erro ao buscar empresas recentes');
        }

        const companiesData = await companiesResponse.json();
        setRecentCompanies(companiesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const stats_cards = [
    {
      title: 'Total de Empresas',
      value: stats.totalEmpresas,
      icon: IconBuilding,
      color: 'bg-primary-500',
    },
    {
      title: 'Total de Categorias',
      value: stats.totalCategorias,
      icon: IconCategory,
      color: 'bg-green-500',
    },
    {
      title: 'Empresas Liberadas',
      value: stats.empresasLiberadas,
      icon: IconCheck,
      color: 'bg-emerald-500',
    },
    {
      title: 'Empresas Bloqueadas',
      value: stats.empresasBloqueadas,
      icon: IconLock,
      color: 'bg-red-500',
    },
  ];

  const accessChartData = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().split('T')[0];

    const accesses = recentCompanies.filter((company) => {
      const companyKey = new Date(company.createdAt).toISOString().split('T')[0];
      return companyKey === key;
    }).length;

    return {
      label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: accesses,
    };
  });

  const maxAccessValue = Math.max(...accessChartData.map((item) => item.value), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Visao geral do Guia Comercial</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">{error}</div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Acessos ao Sistema (7 dias)</h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">visao rapida</span>
        </div>
        <div className="grid grid-cols-7 gap-2 sm:gap-3 items-end h-36">
          {accessChartData.map((item) => {
            const heightPercent = Math.max((item.value / maxAccessValue) * 100, item.value > 0 ? 10 : 4);
            return (
              <div key={item.label} className="flex flex-col items-center justify-end h-full">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-primary-600 to-primary-400 dark:from-primary-500 dark:to-primary-300 transition-all"
                  style={{ height: `${heightPercent}%` }}
                  title={`${item.label}: ${item.value} acessos`}
                />
                <span className="mt-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{item.label}</span>
                <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300">{item.value}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats_cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center">
                <div className={`${card.color} rounded-lg p-3 text-white dark:text-gray-100`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="mt-1 text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">{card.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Empresas Recentes</h2>
          <div className="mt-6 overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nome</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Categoria</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentCompanies.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{company.nome}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{company.categoria}</td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            company.aprovado
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {company.aprovado ? 'Liberada' : 'Bloqueada'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
