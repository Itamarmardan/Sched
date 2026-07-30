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

// Layout can be correct (confirmed via getBoundingClientRect) while the *painted* pixels
// still show the previous, smaller frame — only a real touch forces WebKit to repaint at
// the new size. Toggling display off/on removes the shell from the render tree and back,
// which forces a full repaint on restore, independent of whatever layout-only nudges did.
function forceRepaint() {
  const shell = document.getElementById('app-shell');
  if (!shell) return;
  const prevDisplay = shell.style.display;
  shell.style.display = 'none';
  void shell.offsetHeight;
  shell.style.display = prevDisplay;
}

function runFixPass() {
  nudgeViewport();
  forceRepaint();
}

export default function ViewportFix() {
  useEffect(() => {
    runFixPass();
    // iOS doesn't always finish its own chrome-hiding/relayout by the time this effect
    // runs; a second pass shortly after catches the cases the immediate one misses.
    const retry = setTimeout(runFixPass, 300);

    const onPageShow = () => runFixPass();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') runFixPass();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(retry);
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
