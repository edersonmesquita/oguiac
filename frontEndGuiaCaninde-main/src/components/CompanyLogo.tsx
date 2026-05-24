import Image from 'next/image';

interface CompanyLogoProps {
  logo?: string | null;
  alt?: string;
  className?: string;
}

export default function CompanyLogo({ logo, alt = 'Logo da empresa', className = '' }: CompanyLogoProps) {
  const fallbackIcon = (
    <div className={`w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${className}`}>
      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  );

  if (!logo) {
    return fallbackIcon;
  }

  // Determine the actual source URL
  let imgSrc = logo;
  if (!logo.startsWith('http') && !logo.startsWith('data:image')) {
    // É um caminho relativo, adicione o URL base da API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://backendguiacanind-production.up.railway.app';
    imgSrc = `${apiUrl}${logo.startsWith('/') ? '' : '/'}${logo}`;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <img
        src={imgSrc}
        alt={alt}
        className="w-full h-full object-cover rounded-md"
        onError={(e) => {
          // Fallback para ícone padrão se a imagem falhar ao carregar
          const imgElement = e.currentTarget;
          const parent = imgElement.parentElement;
          if (parent && !imgElement.src.includes('/ICONETESTE.png')) {
            // Substituir pela imagem de fallback
            imgElement.src = '/ICONETESTE.png';
          }
        }}
      />
    </div>
  );
} 