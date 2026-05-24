'use client';

import { useEffect, useState } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { toast, Toaster } from 'react-hot-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  features: string[];
  price: number;
}

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const token = localStorage.getItem('companyToken');
        if (!token) {
          throw new Error('Não autorizado');
        }

        // Fetch company profile to get current plan
        const profileResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!profileResponse.ok) {
          throw new Error('Falha ao carregar dados do perfil');
        }

        const profileData = await profileResponse.json();
        if (profileData.planId) {
          setCurrentPlan(profileData.planId);
        }

        // Fetch available plans
        const plansResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/plans`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!plansResponse.ok) {
          throw new Error('Falha ao carregar planos');
        }

        const plansData = await plansResponse.json();
        setPlans(plansData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const handleSelectPlan = (planId: string) => {
    // In a real implementation, this would open a payment flow
    // For now, we'll just show a toast message
    toast.success('Em breve você poderá contratar este plano. Recurso em desenvolvimento!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 mb-4">
        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // If no plans are available in the database, show some demo plans
  const displayPlans = plans.length > 0 ? plans : [
    {
      id: 'free',
      name: 'Plano Grátis',
      description: 'Listagem básica no diretório',
      features: [
        'Informações básicas da empresa',
        'Contato via WhatsApp',
        'Apenas informações básicas'
      ],
      price: 0.00
    },
    {
      id: 'basic',
      name: 'Plano Básico',
      description: 'Essencial para sua presença digital',
      features: [
        'Listagem no diretório',
        'Informações básicas da empresa',
        'Contato via WhatsApp',
        'Galeria de imagens (3 fotos)',
        'Horário de funcionamento'
      ],
      price: 10.00
    },
    {
      id: 'pro',
      name: 'Plano Pro',
      description: 'Visibilidade completa para sua empresa',
      features: [
        'Tudo do plano básico',
        'Galeria de imagens (20 fotos)',
        'Produtos e serviços em destaque',
        'Vídeo promocional',
        'Posição destacada nas buscas',
        'Suporte prioritário'
      ],
      price: 20.00
    }
  ];

  return (
    <div className="space-y-6">
      <Toaster position="top-center" />
      
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Planos e Assinaturas
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Escolha o melhor plano para a sua empresa
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayPlans.map((plan) => (
          <div 
            key={plan.id}
            className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg border flex flex-col ${
              currentPlan === plan.id 
                ? 'border-indigo-500 dark:border-indigo-400' 
                : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {currentPlan === plan.id && (
              <div className="bg-indigo-500 dark:bg-indigo-600 py-1 px-4">
                <p className="text-xs text-white font-medium text-center">
                  Plano Atual
                </p>
              </div>
            )}
            
            <div className="p-6 flex flex-col flex-1">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {plan.description}
                </p>
              </div>
              
              <p className="mt-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {plan.price === 0 ? 'Grátis' : `R$${plan.price.toFixed(2)}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-sm text-gray-500 dark:text-gray-400"> /mês</span>
                )}
              </p>
              
              <ul className="mt-6 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <IconCheck size={20} className="mr-2 flex-shrink-0 text-green-500 dark:text-green-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-auto pt-8">
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={currentPlan === plan.id}
                  className={`w-full py-2 px-4 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    currentPlan === plan.id
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : plan.id === 'free' 
                        ? 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {currentPlan === plan.id ? 'Plano Atual' : plan.id === 'free' ? 'Plano Padrão' : 'Selecionar Plano'}
                </button>
                <div className="mt-2 text-center">
                  {plan.id !== 'free' && (
                    <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Contratação de planos em breve!</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Comparativo de Recursos
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recurso
                </th>
                {displayPlans.map(plan => (
                  <th key={plan.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Informações básicas
                </td>
                {displayPlans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <IconCheck className="text-green-500 dark:text-green-400" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Contato via WhatsApp
                </td>
                {displayPlans.map(plan => (
                  <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <IconCheck className="text-green-500 dark:text-green-400" />
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Galeria de Imagens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  3 fotos
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  20 fotos
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Horário de Funcionamento
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Produtos e Serviços
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Vídeo Promocional
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Posição Destacada
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  Suporte Prioritário
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconX className="text-gray-300 dark:text-gray-600" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  <IconCheck className="text-green-500 dark:text-green-400" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 