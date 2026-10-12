import type { MetadataRoute } from 'next';
import { SITE } from '@/config/site';

/**
 * Single-route sitemap for the concept demo. The demo is noindex, so this
 * exists for completeness (and for the QA checklist) — at launch, switch
 * SITE.url back to the live domain.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
