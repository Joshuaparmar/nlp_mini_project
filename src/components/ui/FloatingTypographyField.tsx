import React, { useEffect, useRef, useMemo, useState } from 'react';
import { motion, motionValue, animate, useReducedMotion } from 'framer-motion';
import type { MotionValue } from 'framer-motion';

export interface FloatingTypographyFieldProps {
  /**
   * Density of words rendered in the field.
   * 'low': ~14-18 words (ideal for intake/form headers)
   * 'medium': ~30-38 words (ideal for hero banners)
   * 'high': ~48-60 words (ideal for expansive canvas areas)
   */
  density?: 'low' | 'medium' | 'high';
  /**
   * Motion intensity factor: controls drift distance and repulsion radius.
   */
  motionIntensity?: 'subtle' | 'normal' | 'vibrant';
  /**
   * Whether to enable cursor repulsion physics. Automatically disabled on touch screens.
   */
  interactive?: boolean;
  /**
   * Visual theme styling:
   * 'adaptive' - reacts to the application's light/dark mode CSS tokens.
   * 'dark-hero' - tuned specifically for deep dark slate/navy banners.
   * 'light-editorial' - tuned for ivory/paper editorial surfaces.
   */
  themeVariant?: 'adaptive' | 'dark-hero' | 'light-editorial';
  /**
   * Custom words list to override or extend the evidence intelligence vocabulary.
   */
  words?: string[];
  /**
   * Additional Tailwind or CSS classes for the container.
   */
  className?: string;
  /**
   * Inline styles for container.
   */
  style?: React.CSSProperties;
}

// Curated evidence intelligence vocabulary
const DEFAULT_WORDS = [
  'EVIDENCE', 'VERIFY', 'CLAIM', 'SOURCE', 'FACTUAL', 'ANALYSIS',
  'CONTEXT', 'RESEARCH', 'REASONING', 'VALIDATE', 'TRACEABLE',
  'CONSISTENCY', 'CITATION', 'DOCUMENT', 'INSIGHT', 'INTEGRITY',
  'ACCURACY', 'AUDIT', 'CONFIDENCE', 'FINDINGS', 'CONTRADICTION',
  'SEMANTICS', 'REFERENCE', 'UNCERTAINTY', 'PROOF', 'REVIEW',
  // Editorial mixed-casing & short phrases
  'source verified', 'evidence first', 'ground truth', 'cross-checked',
  'confidence score', 'claim audited', 'audit trail', 'veracity',
  'verifiable', 'contextual', 'empirical', 'corroborated'
];

interface WordConfig {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number;
  fontSize: string;
  fontFamily: 'sans' | 'serif' | 'mono';
  baseOpacity: number;
  accent: 'slate' | 'cobalt' | 'cyan' | 'mint' | 'muted';
  duration: number;
  delay: number;
  driftX1: number;
  driftX2: number;
  driftY1: number;
  driftY2: number;
  rot1: number;
  rot2: number;
  repelMultiplier: number;
}

// Deterministic Pseudo-Random Number Generator (Mulberry32)
function createPrng(seed: number) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate deterministic distributed word coordinates avoiding clusters
function generateWords(
  wordPool: string[],
  density: 'low' | 'medium' | 'high',
  motionIntensity: 'subtle' | 'normal' | 'vibrant'
): WordConfig[] {
  const prng = createPrng(42893); // Deterministic seed

  const targetCount = density === 'low' ? 18 : density === 'medium' ? 36 : 54;
  const intensityMultiplier = motionIntensity === 'subtle' ? 0.5 : motionIntensity === 'vibrant' ? 1.5 : 1.0;

  const fontFamilies: Array<'sans' | 'serif' | 'mono'> = ['sans', 'serif', 'mono'];
  const accents: Array<'slate' | 'cobalt' | 'cyan' | 'mint' | 'muted'> = [
    'slate', 'slate', 'muted', 'muted', 'cobalt', 'cyan', 'mint'
  ];

  const results: WordConfig[] = [];
  const minDistance = density === 'high' ? 8 : density === 'medium' ? 11 : 15; // Percent spacing

  // Shuffle word pool deterministically
  const shuffled = [...wordPool].sort(() => prng() - 0.5);

  let attempts = 0;
  let wordIndex = 0;

  while (results.length < targetCount && attempts < 1000) {
    attempts++;
    // Keep words within comfortable viewport bounds (4% to 92%)
    const candX = 4 + prng() * 88;
    const candY = 5 + prng() * 88;

    // Check distance against existing placements to ensure open space & prevent clustering
    const isTooClose = results.some(item => {
      const dx = item.xPercent - candX;
      const dy = item.yPercent - candY;
      return Math.sqrt(dx * dx + dy * dy) < minDistance;
    });

    if (isTooClose && attempts < 800) {
      continue;
    }

    const rawWord = shuffled[wordIndex % shuffled.length];
    wordIndex++;

    // Randomize typography attributes deterministically
    const fontIndex = Math.floor(prng() * fontFamilies.length);
    const accentIndex = Math.floor(prng() * accents.length);
    
    // Vary font sizes tastefully (11px to 14px)
    const fontSizes = ['text-[10px]', 'text-[11px]', 'text-xs', 'text-[13px]'];
    const fontSize = fontSizes[Math.floor(prng() * fontSizes.length)];

    // Drift vectors (smooth loops, max 20-35px offset)
    const driftDist = (15 + prng() * 20) * intensityMultiplier;
    const angle1 = prng() * Math.PI * 2;
    const angle2 = angle1 + Math.PI * 0.7 + prng() * 0.6;

    results.push({
      id: `word-${results.length}-${rawWord.replace(/\s+/g, '-')}`,
      text: rawWord,
      xPercent: candX,
      yPercent: candY,
      fontSize,
      fontFamily: fontFamilies[fontIndex],
      baseOpacity: 0.08 + prng() * 0.16, // 0.08 - 0.24
      accent: accents[accentIndex],
      duration: 18 + prng() * 16, // 18s - 34s duration for organic ambient feel
      delay: prng() * 8, // staggered starts
      driftX1: Math.cos(angle1) * driftDist,
      driftY1: Math.sin(angle1) * driftDist,
      driftX2: Math.cos(angle2) * (driftDist * 0.75),
      driftY2: Math.sin(angle2) * (driftDist * 0.75),
      rot1: (prng() - 0.5) * 4 * intensityMultiplier, // -2deg to +2deg subtle
      rot2: (prng() - 0.5) * 4 * intensityMultiplier,
      repelMultiplier: 0.7 + prng() * 0.7 // 0.7 - 1.4 varied responsiveness
    });
  }

  return results;
}

/**
 * Single Floating Word with ambient looping drift + cursor spring repulsion
 */
const WordItem: React.FC<{
  config: WordConfig;
  themeVariant: 'adaptive' | 'dark-hero' | 'light-editorial';
  reducedMotion: boolean;
  repelX: MotionValue<number>;
  repelY: MotionValue<number>;
}> = ({ config, themeVariant, reducedMotion, repelX, repelY }) => {
  // Compute theme color style classes
  const getColorClass = () => {
    if (themeVariant === 'dark-hero') {
      switch (config.accent) {
        case 'cyan': return 'text-cyan-400/80 font-medium';
        case 'mint': return 'text-emerald-400/80 font-medium';
        case 'cobalt': return 'text-blue-400/80';
        default: return 'text-slate-300';
      }
    }

    if (themeVariant === 'light-editorial') {
      switch (config.accent) {
        case 'cobalt': return 'text-blue-700/70 font-medium';
        case 'cyan': return 'text-sky-700/70';
        default: return 'text-stone-600';
      }
    }

    // Adaptive mode (responds to app CSS variables & dark class)
    switch (config.accent) {
      case 'cobalt': return 'text-blue-600/70 dark:text-blue-400/70 font-medium';
      case 'cyan': return 'text-sky-600/70 dark:text-cyan-400/70';
      case 'mint': return 'text-emerald-700/60 dark:text-emerald-400/70';
      default: return 'text-[var(--text-muted)]';
    }
  };

  const getFontFamilyClass = () => {
    switch (config.fontFamily) {
      case 'serif': return 'font-serif tracking-normal italic';
      case 'mono': return 'font-mono tracking-wider uppercase';
      default: return 'font-sans tracking-tight';
    }
  };

  return (
    <motion.div
      className="absolute pointer-events-none select-none will-change-transform"
      style={{
        left: `${config.xPercent}%`,
        top: `${config.yPercent}%`,
        x: repelX,
        y: repelY,
      }}
    >
      <motion.span
        className={`inline-block ${config.fontSize} ${getFontFamilyClass()} ${getColorClass()}`}
        style={{
          opacity: config.baseOpacity,
        }}
        animate={
          reducedMotion
            ? { x: 0, y: 0, rotate: 0 }
            : {
                x: [0, config.driftX1, config.driftX2, 0],
                y: [0, config.driftY1, config.driftY2, 0],
                rotate: [0, config.rot1, config.rot2, 0],
              }
        }
        transition={
          reducedMotion
            ? { duration: 0 }
            : {
                duration: config.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: config.delay,
              }
        }
      >
        {config.text}
      </motion.span>
    </motion.div>
  );
};

export const FloatingTypographyField: React.FC<FloatingTypographyFieldProps> = ({
  density = 'medium',
  motionIntensity = 'normal',
  interactive = true,
  themeVariant = 'adaptive',
  words: customWords,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isTouchDevice] = useState(() => {
    if (typeof window !== 'undefined') {
      return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    return false;
  });

  // Responsive density adjustments: reduce count on narrow screens
  const [responsiveDensity, setResponsiveDensity] = useState(density);
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setResponsiveDensity('low');
      } else if (width < 1024 && density === 'high') {
        setResponsiveDensity('medium');
      } else {
        setResponsiveDensity(density);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [density]);

  // Generate word configurations deterministically
  const wordConfigs = useMemo(() => {
    const pool = customWords && customWords.length > 0 ? customWords : DEFAULT_WORDS;
    return generateWords(pool, responsiveDensity, motionIntensity);
  }, [responsiveDensity, motionIntensity, customWords]);

  // Create MotionValues for smooth spring repulsion per word without component rerenders
  const motionValuesMap = useMemo(() => {
    const map = new Map<string, { x: MotionValue<number>; y: MotionValue<number> }>();
    wordConfigs.forEach(w => {
      map.set(w.id, {
        x: motionValue(0),
        y: motionValue(0),
      });
    });
    return map;
  }, [wordConfigs]);

  // Attach pointer listener to parent or container for fluid repulsion physics
  useEffect(() => {
    if (!interactive || isTouchDevice || prefersReducedMotion) return;

    const container = containerRef.current;
    if (!container) return;

    // We listen on the containing element (or parent) to track cursor freely
    const targetElement = container.parentElement || container;

    const repulsionRadius = motionIntensity === 'subtle' ? 110 : motionIntensity === 'vibrant' ? 200 : 150;
    const maxDisplacement = motionIntensity === 'subtle' ? 25 : motionIntensity === 'vibrant' ? 55 : 38;

    let rafId: number | null = null;
    let lastEvent: PointerEvent | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      lastEvent = e;
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!lastEvent || !container) return;

        const rect = container.getBoundingClientRect();
        const pointerX = lastEvent.clientX - rect.left;
        const pointerY = lastEvent.clientY - rect.top;

        wordConfigs.forEach(w => {
          const mvs = motionValuesMap.get(w.id);
          if (!mvs) return;

          const wordPosX = (w.xPercent / 100) * rect.width;
          const wordPosY = (w.yPercent / 100) * rect.height;

          const dx = wordPosX - pointerX;
          const dy = wordPosY - pointerY;
          const dist = Math.hypot(dx, dy);

          if (dist < repulsionRadius && dist > 0) {
            // Smooth non-linear repulsion drop-off
            const ratio = (1 - dist / repulsionRadius);
            const force = ratio * ratio * maxDisplacement * w.repelMultiplier;
            const angle = Math.atan2(dy, dx);
            const targetX = Math.cos(angle) * force;
            const targetY = Math.sin(angle) * force;

            animate(mvs.x, targetX, { type: 'spring', stiffness: 140, damping: 18 });
            animate(mvs.y, targetY, { type: 'spring', stiffness: 140, damping: 18 });
          } else {
            // Smooth return to resting path if outside repulsion radius
            if (mvs.x.get() !== 0 || mvs.y.get() !== 0) {
              animate(mvs.x, 0, { type: 'spring', stiffness: 90, damping: 20 });
              animate(mvs.y, 0, { type: 'spring', stiffness: 90, damping: 20 });
            }
          }
        });
      });
    };

    const handlePointerLeave = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      // Return all words smoothly to resting position
      wordConfigs.forEach(w => {
        const mvs = motionValuesMap.get(w.id);
        if (mvs) {
          animate(mvs.x, 0, { type: 'spring', stiffness: 80, damping: 22 });
          animate(mvs.y, 0, { type: 'spring', stiffness: 80, damping: 22 });
        }
      });
    };

    targetElement.addEventListener('pointermove', handlePointerMove as EventListener, { passive: true });
    targetElement.addEventListener('pointerleave', handlePointerLeave as EventListener, { passive: true });

    return () => {
      targetElement.removeEventListener('pointermove', handlePointerMove as EventListener);
      targetElement.removeEventListener('pointerleave', handlePointerLeave as EventListener);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [interactive, isTouchDevice, prefersReducedMotion, wordConfigs, motionIntensity, motionValuesMap]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      role="presentation"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
      style={style}
    >
      {wordConfigs.map(config => {
        const mvs = motionValuesMap.get(config.id);
        return (
          <WordItem
            key={config.id}
            config={config}
            themeVariant={themeVariant}
            reducedMotion={Boolean(prefersReducedMotion)}
            repelX={mvs ? mvs.x : motionValue(0)}
            repelY={mvs ? mvs.y : motionValue(0)}
          />
        );
      })}
    </div>
  );
};

export default FloatingTypographyField;
