export function createHashRouteUrl(path: string): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = path.startsWith('/') ? path : `/${path}`;
  return url.toString();
}
