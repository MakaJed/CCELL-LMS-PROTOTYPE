/**
 * Accessibility Utilities
 * Helpers for improving keyboard navigation, screen reader support, and WCAG compliance
 */

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0] as HTMLElement;
  const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

  function handleTab(e: KeyboardEvent) {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable?.focus();
        e.preventDefault();
      }
    }
  }

  element.addEventListener('keydown', handleTab);
  return () => element.removeEventListener('keydown', handleTab);
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique IDs for form labels and aria-describedby
 */
let idCounter = 0;
export function generateId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Check if element is visible in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view with smooth behavior
 */
export function scrollIntoViewIfNeeded(element: HTMLElement, options?: ScrollIntoViewOptions) {
  if (!isInViewport(element)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      ...options,
    });
  }
}

/**
 * Handle keyboard navigation for lists
 */
export function handleListKeyNavigation(
  event: React.KeyboardEvent,
  currentIndex: number,
  totalItems: number,
  onIndexChange: (newIndex: number) => void,
  onSelect?: (index: number) => void
) {
  let newIndex = currentIndex;

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      newIndex = currentIndex < totalItems - 1 ? currentIndex + 1 : 0;
      break;
    case 'ArrowUp':
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : totalItems - 1;
      break;
    case 'Home':
      event.preventDefault();
      newIndex = 0;
      break;
    case 'End':
      event.preventDefault();
      newIndex = totalItems - 1;
      break;
    case 'Enter':
    case ' ':
      event.preventDefault();
      onSelect?.(currentIndex);
      return;
    default:
      return;
  }

  onIndexChange(newIndex);
}

/**
 * Get ARIA label for progress percentage
 */
export function getProgressAriaLabel(value: number, total: number = 100): string {
  const percentage = Math.round((value / total) * 100);
  return `Progress: ${percentage} percent complete`;
}

/**
 * Format date for screen readers
 */
export function formatDateForScreenReader(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Skip to main content helper
 */
export function skipToMainContent() {
  const main = document.querySelector('main, [role="main"]') as HTMLElement;
  if (main) {
    main.focus();
    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
