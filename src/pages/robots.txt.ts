import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = import.meta.env.BASE_URL;
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL(`${base}sitemap.xml`, site).href}\n`, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
