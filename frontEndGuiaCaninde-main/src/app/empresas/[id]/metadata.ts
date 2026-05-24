import { Metadata } from 'next';
import { extractCompanyIdFromSlug, slugifyCompanyName } from '@/utils/companySlug';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    let companyId = extractCompanyIdFromSlug(params.id);
    if (companyId === params.id) {
      const listResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`, { cache: 'no-store' });
      if (listResponse.ok) {
        const companies = await listResponse.json();
        const found = companies.find((c: { id: string; name: string }) => slugifyCompanyName(c.name) === params.id);
        if (found?.id) companyId = found.id;
      }
    }
    // Add cache-control headers to prevent caching
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies/${companyId}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch company: ${response.status}`);
    }

    const company = await response.json();

    // Log company data for debugging
    console.log('Company data:', JSON.stringify({
      id: company.id,
      name: company.name,
      logo: company.logo,
      description: company.description,
      category: company.category
    }, null, 2));

    const description = company.description || `${company.name} em Canindé - ${company.category.name}`;
    const title = `${company.name} - Guia Canindé`;
    
    // Construir URL absoluta da logo
    let imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png';
    if (company.logo) {
      const logo = company.logo;
      if (logo.startsWith('http')) {
        imageUrl = logo;
      } else if (logo.startsWith('/')) {
        imageUrl = `${process.env.NEXT_PUBLIC_API_URL}${logo}`;
      } else {
        imageUrl = `${process.env.NEXT_PUBLIC_API_URL}/${logo}`;
      }
      // Validate the URL
      try {
        new URL(imageUrl);
        // Verifica se a URL é acessível
        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
        if (!imageResponse.ok) {
          console.error('Image URL is not accessible:', imageUrl);
          imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png';
        }
      } catch (e) {
        console.error('Invalid image URL:', imageUrl);
        imageUrl = 'https://oguiacaninde.com.br/ICONETESTE.png';
      }
    }

    const metadata: Metadata = {
      metadataBase: new URL('https://oguiacaninde.com.br'),
      title,
      description,
      openGraph: {
        title,
        description,
        siteName: 'Guia Canindé',
        type: 'website',
        url: `https://oguiacaninde.com.br/share/${companyId}`,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: company.name,
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
        'og:image': imageUrl,
        'og:image:secure_url': imageUrl,
      }
    };

    console.log('Generated metadata:', JSON.stringify(metadata, null, 2));
    return metadata;

  } catch (error) {
    console.error('Error generating metadata:', error);
    
    // Return a more complete fallback metadata
    return {
      metadataBase: new URL('https://oguiacaninde.com.br'),
      title: 'Empresa - Guia Canindé',
      description: 'Detalhes da empresa no Guia Canindé',
      openGraph: {
        title: 'Empresa - Guia Canindé',
        description: 'Detalhes da empresa no Guia Canindé',
        siteName: 'Guia Canindé',
        type: 'website',
        images: [{
          url: 'https://oguiacaninde.com.br/ICONETESTE.png',
          width: 1200,
          height: 630,
          alt: 'Guia Canindé'
        }]
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Empresa - Guia Canindé',
        description: 'Detalhes da empresa no Guia Canindé',
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
