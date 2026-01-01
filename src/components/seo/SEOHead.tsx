import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
}

export function SEOHead({
  title = "Soomro Law Services CMS | Secure Internal Client & Case Management",
  description = "Comprehensive legal practice management system for law firms. Manage clients, cases, documents, invoices, and appointments with role-based access control.",
  keywords = "legal practice management, law firm software, case management, client management, legal CMS, law firm CRM, legal billing, document management",
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
}: SEOHeadProps) {
  useEffect(() => {
    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Standard meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    
    // Robots
    if (noindex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow');
    }

    // Open Graph
    updateMeta('og:title', title, true);
    updateMeta('og:description', description, true);
    updateMeta('og:type', ogType, true);
    if (ogImage) {
      updateMeta('og:image', ogImage, true);
    }
    if (canonical) {
      updateMeta('og:url', canonical, true);
    }

    // Twitter
    updateMeta('twitter:title', title);
    updateMeta('twitter:description', description);
    if (ogImage) {
      updateMeta('twitter:image', ogImage);
    }

    // Update canonical link
    if (canonical) {
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    return () => {
      // Cleanup is optional since we're just updating existing tags
    };
  }, [title, description, keywords, canonical, ogImage, ogType, noindex]);

  return null;
}
