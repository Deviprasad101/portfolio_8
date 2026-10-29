import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export default function CustomCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const [cursorMode, setCursorMode] = useState('default'); // 'default' | 'link' | 'OPEN' | 'DRAG'
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const isTouch =
      window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      navigator.maxTouchPoints > 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouch) {
      setEnabled(false);
      return;
    }
    setEnabled(true);

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const ringDur = reduced ? 0.05 : 0.45;
    const xDot = gsap.quickSetter(dot, 'x', 'px');
    const yDot = gsap.quickSetter(dot, 'y', 'px');
    const xRing = gsap.quickTo(ring, 'x', { duration: ringDur, ease: 'power3.out' });
    const yRing = gsap.quickTo(ring, 'y', { duration: ringDur, ease: 'power3.out' });

    let visible = false;

    const onMove = (e) => {
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        ring.style.opacity = '1';
        gsap.set(ring, { x: e.clientX, y: e.clientY });
      }
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);

      const target = e.target;
      if (!(target instanceof Element)) return;
      const customEl = target.closest('[data-cursor]');
      if (customEl) {
        const val = (customEl.getAttribute('data-cursor') || 'OPEN').toUpperCase();
        setCursorMode(val);
        return;
      }
      const interactive = target.closest('a, button, [role="button"]');
      if (interactive) {
        setCursorMode('link');
      } else {
        setCursorMode('default');
      }
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isDisc = cursorMode === 'OPEN' || cursorMode === 'DRAG';
  const ringClass = [
    'cursor-ring',
    cursorMode === 'link' ? 'is-link' : '',
    isDisc ? 'is-disc' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className={ringClass} aria-hidden="true">
        {isDisc && <span className="cursor-disc-label">{cursorMode}</span>}
      </div>
    </>
  );
}

