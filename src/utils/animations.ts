import gsap from 'gsap';

// Helper to check for user reduced motion preference
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Clean entrance animation for major views
 */
export const animatePageEntry = (container: HTMLElement | null) => {
  if (!container || prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    gsap.fromTo(
      container,
      {
        opacity: 0,
        y: 8,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out',
      }
    );
  }, container);

  return () => ctx.revert();
};

/**
 * Staggered entrance for lists/cards
 */
export const animateStaggerCards = (elements: HTMLElement[] | NodeListOf<Element> | null) => {
  if (!elements || prefersReducedMotion()) return;

  const ctx = gsap.context(() => {
    gsap.fromTo(
      elements,
      {
        opacity: 0,
        y: 12,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.06,
        ease: 'power2.out',
      }
    );
  });

  return () => ctx.revert();
};

/**
 * Processing timeline step transition
 */
export const animateTimelineStep = (element: HTMLElement | null) => {
  if (!element || prefersReducedMotion()) return;

  gsap.fromTo(
    element,
    { scale: 0.94, opacity: 0.6 },
    { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.5)' }
  );
};

/**
 * Smooth height reveal for expandable details
 */
export const animateExpandDetails = (element: HTMLElement | null, onComplete?: () => void) => {
  if (!element) return;
  if (prefersReducedMotion()) {
    element.style.display = 'block';
    onComplete?.();
    return;
  }

  gsap.fromTo(
    element,
    { height: 0, opacity: 0 },
    {
      height: 'auto',
      opacity: 1,
      duration: 0.28,
      ease: 'power2.out',
      onComplete,
    }
  );
};
