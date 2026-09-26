import type { MetadataRoute } from 'next';
import { serviceFamilies } from '@/app/features/servicesSection/servicesData';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/services',
    ...serviceFamilies.map((family) => `/services/${family.slug}`),
    '/privacy-policy',
    '/cookie-policy',
    '/terms',
    '/paia-manual',
  ];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : 0.6,
  }));
}
