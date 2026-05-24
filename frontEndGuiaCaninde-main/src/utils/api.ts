/**
 * Constructs API URLs safely, avoiding double slashes
 * @param endpoint - The API endpoint (should start with /)
 * @returns The complete API URL
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  // Remove trailing slash from base URL if it exists
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Ensure endpoint starts with /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${cleanBaseUrl}${cleanEndpoint}`;
}

/**
 * Constructs file URLs safely for images and other assets
 * @param filePath - The file path (can start with or without /)
 * @returns The complete file URL
 */
export function getFileUrl(filePath: string): string {
  if (!filePath) return '';
  
  // If it's already a full URL, return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // Handle file path with or without leading slash
  const cleanFilePath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  return `${cleanBaseUrl}${cleanFilePath}`;
} 