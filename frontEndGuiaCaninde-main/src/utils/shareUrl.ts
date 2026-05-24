export function getPublicShareBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && !configured.includes('localhost')) {
    return configured.replace(/\/+$/, '');
  }
  return 'https://oguiacaninde.com.br';
}

export function getCompanyShareUrl(companyId: string): string {
  return `${getPublicShareBaseUrl()}/share/${companyId}`;
}
