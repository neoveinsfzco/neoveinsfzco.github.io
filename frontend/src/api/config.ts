const LOCAL_API_BASE_URL = 'http://127.0.0.1:8000/api/';
const DEPLOYED_API_BASE_URL = 'https://amddawg.pythonanywhere.com/api/';

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io')
    ? DEPLOYED_API_BASE_URL
    : LOCAL_API_BASE_URL);

const API_URL = new URL(API_BASE_URL);
export const BACKEND_ORIGIN = API_URL.origin;

export const resolveBackendFileUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${BACKEND_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};
