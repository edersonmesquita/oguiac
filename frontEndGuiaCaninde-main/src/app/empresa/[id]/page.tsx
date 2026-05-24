'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import DynamicMetaTags from '@/components/DynamicMetaTags';
import CompanyLogo from '@/components/CompanyLogo';

export default function EmpresaDetalhes() {
  const params = useParams();
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL_FRONTEND}/api/companies/${params.id}`);
        setEmpresa(response.data);
      } catch (error) {
        console.error('Erro ao carregar empresa:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmpresa();
  }, [params.id]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!empresa) {
    return <div>Empresa não encontrada</div>;
  }

  // Construir a URL completa da empresa
  const companyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/share/${params.id}`;
  
  // Garantir que a URL da logo seja absoluta
  const companyLogo = empresa.logo?.startsWith('http') 
    ? empresa.logo 
    : `${process.env.NEXT_PUBLIC_API_URL_FRONTEND}${empresa.logo}`;

  return (
    <>
      <DynamicMetaTags
        companyName={empresa.name}
        companyDescription={empresa.description || `Conheça ${empresa.name} em Canindé`}
        companyLogo={companyLogo}
        companyUrl={companyUrl}
      />
      
      {/* Resto do conteúdo da página */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24">
              <CompanyLogo logo={empresa.logo} alt={empresa.name} className="w-24 h-24" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{empresa.name}</h1>
              {empresa.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {empresa.description}
                </p>
              )}
            </div>
          </div>
          
          {/* Resto das informações da empresa */}
          {/* ... */}
        </div>
      </div>
    </>
  );
} 