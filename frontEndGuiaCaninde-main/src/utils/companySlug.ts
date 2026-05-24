export function slugifyCompanyName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function toCompanySlug(name: string, id: string): string {
  return slugifyCompanyName(name);
}

export function extractCompanyIdFromSlug(slugOrId: string): string {
  const value = Array.isArray(slugOrId) ? slugOrId[0] : slugOrId;
  const match = value.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  return match ? match[0] : value;
}
