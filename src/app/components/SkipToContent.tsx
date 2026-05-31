/**
 * Skip to Main Content Link
 * Allows keyboard users to skip navigation and jump directly to main content
 * WCAG 2.1 Level A requirement
 */

export function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const main = document.getElementById('main-content') as HTMLElement;
    if (main) {
      main.focus();
      main.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#1A237E] focus:text-white focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#FFB300] focus:ring-offset-2"
    >
      Skip to main content
    </a>
  );
}
