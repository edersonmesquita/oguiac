'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, BuildingStorefrontIcon, MagnifyingGlassIcon, PlusCircleIcon, ChartBarIcon, UserIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isCompanyLoggedIn, setIsCompanyLoggedIn] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Function to check company login status
  const checkCompanyLogin = () => {
    const companyToken = localStorage.getItem('companyToken');
    setIsCompanyLoggedIn(!!companyToken);
  };

  useEffect(() => {
    // Check if company is logged in
    checkCompanyLogin();
    
    // Listen for storage changes (when company logs in or out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'companyToken') {
        setIsCompanyLoggedIn(!!e.newValue);
      }
    };

    // Listen for custom login/logout events
    const handleCompanyLoginChange = () => {
      checkCompanyLogin();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('companyLoginChanged', handleCompanyLoginChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('companyLoginChanged', handleCompanyLoginChange);
    };
  }, []);

  const isActive = (path: string) => pathname === path;

  // Main nav items (always visible)
  const mainNavItems = [
    {
      href: '/',
      icon: <HomeIcon className="w-6 h-6" />,
      label: 'Início'
    },
    {
      href: '/categorias',
      icon: <BuildingStorefrontIcon className="w-6 h-6" />,
      label: 'Categorias'
    },
    {
      href: '/buscar',
      icon: <MagnifyingGlassIcon className="w-6 h-6" />,
      label: 'Buscar'
    },
    {
      href: '#',
      icon: (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          {showMoreOptions ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      ),
      label: showMoreOptions ? 'Fechar' : 'Mais',
      onClick: () => setShowMoreOptions(!showMoreOptions)
    }
  ];

  return (
    <>
      {/* Main navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 transition-colors duration-300">
        <div className="flex items-center justify-around h-16">
          {mainNavItems.map((item, index) => (
            <div
              key={index}
              onClick={item.onClick}
              className="flex flex-col items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors px-4"
            >
              {item.href === '#' ? (
                <button className="flex flex-col items-center gap-1">
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </button>
              ) : (
                <Link href={item.href} className="flex flex-col items-center gap-1">
                  {item.icon}
                  <span className="text-xs">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {/* Extended menu (when "More" is clicked) */}
      {showMoreOptions && (
        <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 transition-all duration-300 shadow-lg">
          <div className="flex flex-col divide-y divide-gray-200 dark:divide-gray-700">
            {isAuthenticated && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowMoreOptions(false)}
              >
                <ChartBarIcon className="w-6 h-6" />
                <span>Dashboard Admin</span>
              </Link>
            )}
            
            {isCompanyLoggedIn && (
              <Link
                href="/empresa-dashboard"
                className="flex items-center gap-3 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowMoreOptions(false)}
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
                </svg>
                <span>Dashboard Empresa</span>
              </Link>
            )}

            {!isCompanyLoggedIn && (
              <Link
                href="/empresa-login"
                className="flex items-center gap-3 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowMoreOptions(false)}
              >
                <svg className="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span>Login Empresa</span>
              </Link>
            )}

            <Link
              href="/cadastrar"
              className="flex items-center gap-3 px-6 py-4 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setShowMoreOptions(false)}
            >
              <PlusCircleIcon className="w-6 h-6" />
              <span>Cadastrar Negócio</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
} 