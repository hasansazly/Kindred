'use client';

import { useEffect } from 'react';

export default function ViewportFix() {
  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'viewport');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover');
  }, []);

  return null;
}
