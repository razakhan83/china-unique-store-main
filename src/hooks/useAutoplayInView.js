'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to control carousel and slider autoplay based on IntersectionObserver.
 * Guarantees zero active timer intervals when the carousel is off-screen or the tab is hidden.
 * Prevents mobile CPU/battery drain from multiple concurrent background timers.
 *
 * @param {object} options
 * @param {React.RefObject} options.containerRef - Ref of the container DOM element to observe
 * @param {Function} options.onAdvance - Callback to trigger next slide
 * @param {number} [options.intervalMs=8000] - Autoplay interval in milliseconds
 * @param {number} [options.idleResumeMs=10000] - Milliseconds of user idle before resuming autoplay after interaction
 * @param {boolean} [options.enabled=true] - Whether autoplay is enabled
 * @param {boolean} [options.pauseOnHover=true] - Whether hovering on desktop pauses the timer
 */
export function useAutoplayInView({
  containerRef,
  onAdvance,
  intervalMs = 8000,
  idleResumeMs = 10000,
  enabled = true,
  pauseOnHover = true,
}) {
  const isInViewportRef = useRef(false);
  const isHoveredRef = useRef(false);
  const isTouchPausedRef = useRef(false);
  const autoplayTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const onAdvanceRef = useRef(onAdvance);

  useEffect(() => {
    onAdvanceRef.current = onAdvance;
  }, [onAdvance]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, []);

  const updateAutoplayState = useCallback(() => {
    const isDocVisible = typeof document !== 'undefined' ? !document.hidden : true;
    const shouldPlay =
      enabled &&
      isInViewportRef.current &&
      !isHoveredRef.current &&
      !isTouchPausedRef.current &&
      isDocVisible;

    if (shouldPlay) {
      if (!autoplayTimerRef.current) {
        autoplayTimerRef.current = setInterval(() => {
          if (typeof onAdvanceRef.current === 'function') {
            onAdvanceRef.current();
          }
        }, intervalMs);
      }
    } else {
      stopAutoplay();
    }
  }, [enabled, intervalMs, stopAutoplay]);

  const handlePointerInteraction = useCallback(() => {
    isTouchPausedRef.current = true;
    stopAutoplay();
    clearResumeTimer();
    resumeTimerRef.current = setTimeout(() => {
      isTouchPausedRef.current = false;
      updateAutoplayState();
    }, idleResumeMs);
  }, [clearResumeTimer, idleResumeMs, stopAutoplay, updateAutoplayState]);

  useEffect(() => {
    if (!enabled) {
      stopAutoplay();
      clearResumeTimer();
      return undefined;
    }

    const el = containerRef?.current;
    let observer = null;

    const handleMouseEnter = () => {
      if (!pauseOnHover) return;
      isHoveredRef.current = true;
      stopAutoplay();
    };

    const handleMouseLeave = () => {
      if (!pauseOnHover) return;
      isHoveredRef.current = false;
      updateAutoplayState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAutoplay();
        clearResumeTimer();
      } else {
        updateAutoplayState();
      }
    };

    if (typeof IntersectionObserver !== 'undefined' && el) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          const isVisible = Boolean(entry && entry.isIntersecting);
          isInViewportRef.current = isVisible;

          if (!isVisible) {
            isTouchPausedRef.current = false;
            clearResumeTimer();
            stopAutoplay();
          } else {
            updateAutoplayState();
          }
        },
        { threshold: 0.05 }
      );
      observer.observe(el);
    } else {
      isInViewportRef.current = true;
      updateAutoplayState();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

    if (el && pauseOnHover) {
      el.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      el.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    return () => {
      stopAutoplay();
      clearResumeTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (observer) observer.disconnect();
      if (el && pauseOnHover) {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [containerRef, enabled, pauseOnHover, clearResumeTimer, stopAutoplay, updateAutoplayState]);

  return {
    handlePointerInteraction,
    stopAutoplay,
  };
}
