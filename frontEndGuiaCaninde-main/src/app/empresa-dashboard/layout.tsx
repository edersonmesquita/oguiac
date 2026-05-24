'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { IconBuildingStore, IconSettings, IconLogout, IconDashboard, IconCreditCard, IconHome, IconMenu2, IconX } from '@tabler/icons-react';

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if company is logged in
    const token = localStorage.getItem('companyToken');
    
    if (!token) {
      router.push('/empresa-login');
      return;
    }

    // Fetch company profile
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/company-dashboard/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const data = await response.json();
        setCompany(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        localStorage.removeItem('companyToken');
        router.push('/empresa-login');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('companyToken');
    // Dispatch custom event to update navigation components
    window.dispatchEvent(new Event('companyLoginChanged'));
    router.push('/empresa-login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Sidebar content component for reuse
  const SidebarContent = () => (
    <>
      {company && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Empresa:</p>
          <p className="font-medium text-gray-800 dark:text-white">{company.name}</p>
        </div>
      )}
      
      <nav className="flex-1 p-4 space-y-1">
        <Link 
          href="/empresa-dashboard" 
          className="flex items-center px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={() => setMobileMenuOpen(false)}
        >
          <IconDashboard size={20} className="mr-3" /> 
          Dashboard
        </Link>
        <Link 
          href="/empresa-dashboard/perfil" 
          className="flex items-center px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={() => setMobileMenuOpen(false)}
        >
          <IconSettings size={20} className="mr-3" /> 
          Perfil da Empresa
        </Link>
        <Link 
          href="/empresa-dashboard/planos" 
          className="flex items-center px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={() => setMobileMenuOpen(false)}
        >
          <IconCreditCard size={20} className="mr-3" /> 
          Planos
        </Link>
      </nav>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md"
        >
          <IconLogout size={20} className="mr-3" /> 
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <IconBuildingStore size={24} className="text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              Área da Empresa
            </h1>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <SidebarContent />
        </div>
      )}

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <IconBuildingStore size={24} className="text-indigo-600 dark:text-indigo-400" />
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                Área da Empresa
              </h1>
            </div>
          </div>
          <SidebarContent />
        </div>
        
        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 