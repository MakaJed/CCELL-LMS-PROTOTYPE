/* Lightweight HTML sanitizer wrapper with DOMPurify fallback.
   - Prefers DOMPurify when available (global window.DOMPurify or require('dompurify'))
   - Falls back to a basic regex-based stripper for script/style tags and inline event handlers.
   - This keeps the app buildable even before installing dompurify; please run:
       npm i dompurify && npm i -D @types/dompurify
*/

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getPurify(): any | null {
  try {
    if (typeof window !== 'undefined') {
      const w = window as unknown as { DOMPurify?: any };
      if (w.DOMPurify && typeof w.DOMPurify.sanitize === 'function') return w.DOMPurify;
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = typeof require !== 'undefined' ? require('dompurify') : null;
    if (mod?.sanitize) return mod;
    if (mod?.default?.sanitize) return mod.default;
  } catch (_) {}
  return null;
}

function basicSanitize(html: string): string {
  // Very conservative fallback; remove script/style and event handlers
  return (html || '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/ on[a-z]+="[^"]*"/gi, '')
    .replace(/ on[a-z]+='[^']*'/gi, '');
}

export function sanitize(html: string): string {
  const purifier = getPurify();
  if (purifier) {
    try {
      return purifier.sanitize(html || '', { USE_PROFILES: { html: true } });
    } catch (_) {
      return basicSanitize(html || '');
    }
  }
  return basicSanitize(html || '');
}
