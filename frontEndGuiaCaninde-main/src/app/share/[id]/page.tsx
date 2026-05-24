
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { headers } from 'next/headers';
import CompanyLogo from '@/components/CompanyLogo';
import { toCompanySlug } from '@/utils/companySlug';

// Removendo a configuração estática para permitir melhor processamento pelos crawlers
// export const dynamic = 'force-static';
// export const revalidate = 3600; // Revalidar a cada 1 hora

interface Props {
  params: {
    id: string;
  };
}

// Gera os metadados de forma dinâmica
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${params.id}`,
      { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      }
    );

    if (!response.ok) {
      return {
        metadataBase: new URL('https://oguiacaninde.com.br'),
        title: 'Guia Canindé',
        description: 'Diretório de empresas e serviços de Canindé',
        openGraph: {
          title: 'Guia Canindé',
          description: 'Diretório de empresas e serviços de Canindé',
          siteName: 'Guia Canindé',
          type: 'website',
          url: 'https://oguiacaninde.com.br',
          images: [
            {
              url: 'https://oguiacaninde.com.br/ICONETESTE.png',
              width: 1200,
              height: 630,
              alt: 'Guia Canindé',
            }
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Guia Canindé',
          description: 'Diretório de empresas e serviços de Canindé',
          images: ['https://oguiacaninde.com.br/ICONETESTE.png'],
        },
        other: {
          'og:image:width': '1200',
          'og:image:height': '630',
          'og:locale': 'pt_BR',
          'og:type': 'website',
          'og:site_name': 'Guia Canindé',
        }
      };
    }

    const company = await response.json();
    const title = company?.name ? `${company.name} - Guia Canindé` : 'Guia Canindé';
    const description = company?.description || (company?.name && company?.category?.name
      ? `${company.name} em Canindé - ${company.category.name}`
      : 'Diretório de empresas e serviços de Canindé');

    // Processamento da logo com validações rigorosas
    let imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png';
    if (company?.logo) {
      const logo = company.logo;
      if (logo.startsWith('http')) {
        imageUrl = logo;
      } else if (logo.startsWith('/')) {
        imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${logo}`;
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${logo}`;
      }
      // Garantir que a URL seja absoluta e bem formada
      try {
        new URL(imageUrl);
      } catch (e) {
        imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png';
      }
    }

    console.log(`Generating metadata for company: ${company.name}, Image URL: ${imageUrl}`);

    return {
      metadataBase: new URL('https://oguiacaninde.com.br'),
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: 'Guia Canindé',
        type: 'website',
        url: `https://oguiacaninde.com.br/share/${params.id}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: company?.name || 'Guia Canindé',
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      other: {
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:locale': 'pt_BR',
        'og:type': 'website',
        'og:site_name': 'Guia Canindé',
      }
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      metadataBase: new URL('https://oguiacaninde.com.br'),
      title: 'Guia Canindé',
      description: 'Diretório de empresas e serviços de Canindé',
      openGraph: {
        title: 'Guia Canindé',
        description: 'Diretório de empresas e serviços de Canindé',
        siteName: 'Guia Canindé',
        type: 'website',
        url: 'https://oguiacaninde.com.br',
        images: [
          {
            url: 'https://oguiacaninde.com.br/ICONETESTE.png',
            width: 1200,
            height: 630,
            alt: 'Guia Canindé',
          }
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Guia Canindé',
        description: 'Diretório de empresas e serviços de Canindé',
        images: ['https://oguiacaninde.com.br/ICONETESTE.png'],
      },
      other: {
        'og:image:width': '1200',
        'og:image:height': '630',
        'og:locale': 'pt_BR',
        'og:type': 'website',
        'og:site_name': 'Guia Canindé',
      }
    };
  }
}

// Em vez de apenas redirecionar, criamos uma página intermediária com metadados
export default async function SharePage({ params }: Props) {
  // Detectar se é um bot ou usuário
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const isBot = userAgent.toLowerCase().includes('bot') || 
                userAgent.toLowerCase().includes('facebook') || 
                userAgent.toLowerCase().includes('whatsapp') ||
                userAgent.toLowerCase().includes('twitter') ||
                userAgent.toLowerCase().includes('telegram');

  // Buscar dados da empresa para exibir
  let company = null;
  let imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png'; // URL padrão inicial
   
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/companies/${params.id}`,
      { cache: 'no-store' }
    );
    
    if (response.ok) {
      company = await response.json();
      
      // Processar URL da imagem para o componente
      if (company.logo) {
        // Verifica se é uma URL do Uploadthing ou outra URL absoluta
        if (company.logo.includes('uploadthing') || 
            (company.logo.startsWith('http') && !company.logo.includes('localhost'))) {
          imageUrl = company.logo;
          console.log('Using company logo:', imageUrl);
        } else {
          console.log('Logo URL não é utilizável:', company.logo);
        }
      } else {
        console.log('Empresa não tem logo, usando padrão');
      }
    }
  } catch (error) {
    console.error('Error fetching company data:', error);
  }

  // Adiciona head explícito com meta tags
  const headTags = `
    <meta property="og:title" content="${company?.name || 'Guia Canindé'}" />
    <meta property="og:description" content="${company?.description || 'Diretório de empresas e serviços de Canindé'}" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="og:url" content="https://oguiacaninde.com.br/share/${params.id}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Guia Canindé" />
  `;

  const imageUrll = company.logo.startsWith('http') || company.logo.startsWith('data:image')
    ? company.logo 
    : `${process.env.NEXT_PUBLIC_API_URL}${company.logo.startsWith('/') ? '' : '/'}${company.logo}`;

  // Se for um bot, renderizar a página com mais informações
  // Se for um usuário real, mostrar uma página de redirecionamento
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div dangerouslySetInnerHTML={{ __html: `<head>${headTags}</head>` }} />
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-md w-full text-center">
        {company && (
          <>
            <div className="mb-4 relative w-24 h-24 mx-auto">
            <div className={`relative overflow-hidden rounded-lg`}>
      <img
        src={imageUrll}
        alt={company.name}
      />
    </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {company.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {company.category?.name}
            </p>
          </>
        )}
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Você está sendo redirecionado para os detalhes desta empresa no Guia Canindé...
        </p>
        
        <Link 
          href={`/empresas/${toCompanySlug(company?.name || 'empresa', params.id)}`}
          className="inline-block bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg px-5 py-2.5 transition-colors"
        >
          Ir para a página agora
        </Link>
        
        {/* Script para redirecionamento após 2 segundos */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(function() {
                window.location.href = "/share/${params.id}";
              }, 2000);
            `,
          }}
        />
      </div>
    </div>
  );
} 
