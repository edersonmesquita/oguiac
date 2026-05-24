import Head from 'next/head';

interface DynamicMetaTagsProps {
  companyName: string;
  companyDescription: string;
  companyLogo: string;
  companyUrl: string;
}

export default function DynamicMetaTags({
  companyName,
  companyDescription,
  companyLogo,
  companyUrl,
}: DynamicMetaTagsProps) {
  return (
    <Head>
      <title>{companyName} - Guia Canindé</title>
      <meta name="description" content={companyDescription} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={companyUrl} />
      <meta property="og:title" content={companyName} />
      <meta property="og:description" content={companyDescription} />
      <meta property="og:image" content={companyLogo} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={companyUrl} />
      <meta property="twitter:title" content={companyName} />
      <meta property="twitter:description" content={companyDescription} />
      <meta property="twitter:image" content={companyLogo} />
    </Head>
  );
} 