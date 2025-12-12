'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    
    if (!gaId) {
      return;
    }

    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    
    if (window.gtag) {
      window.gtag('config', gaId, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}
