import { useEffect } from 'react';
import { useLocation } from 'react-router';

/**
 * ScrollToTop Component
 * Scrolls to top of page on route navigation
 * Prevents the "stuck scroll" issue in SPAs
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Disable browser's automatic scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    // Scroll to top on route change
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll, 'smooth' for animated
    });

    // Alternative: Scroll to main content if it exists
    // const mainContent = document.querySelector('main, [role="main"]') as HTMLElement;
    // if (mainContent) {
    //   mainContent.scrollIntoView({ behavior: 'instant', block: 'start' });
    // }
  }, [pathname]); // Run effect whenever the route changes

  return null; // This component doesn't render anything
}
