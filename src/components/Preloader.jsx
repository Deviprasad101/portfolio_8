import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DATA } from '../data';

export default function Preloader({ progress, loaded, onComplete }) {
  const rootRef = useRef(null);
  const innerRef = useRef(null);
  const [greetIdx, setGreetIdx] = useState(0);
  const [displayNum, setDisplayNum] = useState(0);
  const [done, setDone] = useState(false);

  const valRef = useRef(0);
  const progressRef = useRef(0);
  const loadedRef = useRef(false);
  const completedRef = useRef(false);

  progressRef.current = progress;
  loadedRef.current = loaded;

  useEffect(() => {
    const id = setInterval(() => {
      setGreetIdx((i) => (i + 1) % DATA.preloaderGreetings.length);
    }, 260);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minDuration = reduced ? 400 : 1850;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now) => {
      const elapsed = now - startTime;
      const timeCap = Math.min(1, elapsed / minDuration);
      const realTarget = loadedRef.current ? 100 : Math.min(99, progressRef.current * 100);
      const cappedTarget = Math.min(realTarget, timeCap * 100);

      valRef.current += (cappedTarget - valRef.current) * 0.14;
      if (loadedRef.current && timeCap >= 1 && valRef.current > 99.4) {
        valRef.current = 100;
      }

      const rounded = Math.round(valRef.current);
      setDisplayNum(rounded);

      if (rounded >= 100 && loadedRef.current && timeCap >= 1 && !completedRef.current) {
        completedRef.current = true;
        const tl = gsap.timeline({
          onComplete: () => {
            setDone(true);
            onComplete?.();
          },
        });
        if (reduced) {
          tl.to(rootRef.current, { opacity: 0, duration: 0.35 });
        } else {
          tl.to(innerRef.current.children, {
            y: -28,
            opacity: 0,
            stagger: 0.05,
            duration: 0.45,
            ease: 'power3.inOut',
          }).to(
            rootRef.current,
            {
              clipPath: 'inset(0% 0% 100% 0%)',
              duration: 1.1,
              ease: 'expo.inOut',
            },
            '-=0.12'
          );
        }
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  if (done) return null;

  const padded = String(displayNum).padStart(3, '0');

  return (
    <div
      ref={rootRef}
      className="preloader"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      aria-label="Loading portfolio"
    >
      <div ref={innerRef} className="preloader-inner">
        <div className="preloader-top-meta">
          <span>{DATA.fullName}</span>
          <span>Portfolio {DATA.year}</span>
        </div>

        <div className="preloader-center">
          <div className="preloader-greeting" key={greetIdx}>
            {DATA.preloaderGreetings[greetIdx]}
          </div>
          <div className="preloader-counter">{padded}</div>
        </div>

        <div className="preloader-bar-wrap">
          <div className="preloader-bar-track">
            <div
              className="preloader-bar-fill"
              style={{ transform: `scaleX(${displayNum / 100})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

