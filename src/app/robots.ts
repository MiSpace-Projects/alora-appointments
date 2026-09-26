import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Authenticated areas have no SEO value and should not be crawled.
      disallow: [
        '/profile',
        '/book',
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/two-factor',
        '/verify-email',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
