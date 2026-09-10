export const getAuthenticatedFileUrl = (relativeUrl?: string) => {
  if (!relativeUrl) return '';
  // If it's already an absolute URL (like old S3 presigned URLs), just return it
  if (relativeUrl.startsWith('http')) return relativeUrl;

  const baseUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') 
    : 'http://localhost:5000';
    
  const token = localStorage.getItem('hfs_token');
  
  return `${baseUrl}${relativeUrl}?token=${token}`;
};
