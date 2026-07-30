'use client';

import { useEffect } from 'react';

// iOS WebKit bug (standalone home-screen PWAs): on cold launch the WebView sometimes
// computes the initial layout viewport wrong — the page renders zoomed out (or wider than
// the screen and pannable) until *something* forces a relayout, at which point it snaps to
// the correct full-width size. Any interaction fixes it, which is the tell.
// The fix is to force that relayout ourselves right after launch, on resume from background,
// and on bfcache restore, by nudging the viewport meta tag and firing a resize event.
function nudgeViewport() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return;
  const original = meta.getAttribute('content') ?? '';
  meta.setAttribute('content', `${original}, maximum-scale=1`);
  requestAnimationFrame(() => {
    meta.setAttribute('content', original);
    window.scrollTo(0, 0);
    window.dispatchEvent(new Event('resize'));
  });
}

export default function ViewportFix() {
  useEffect(() => {
    nudgeViewport();
    const onPageShow = () => nudgeViewport();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') nudgeViewport();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
