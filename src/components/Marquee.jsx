import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';

gsap.registerPlugin(ScrollTrigger);

export default function Marquee() {
  const bandRef = useRef(null);
  const trackRef = useRef(null);
  const skewRef = useRef(null);

  useEffect(() => {
    const band = bandRef.current;
    const track = trackRef.current;
    const skewEl = skewRef.current;
    if (!band || !track || !skewEl) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let xPct = 0;
    let scrollBoost = 0;
    let currentSkew = 0;
    let dir = -1;
    let inView = false;

    const st = ScrollTrigger.create({
      trigger: document.body,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const vel = self.getVelocity();
        if (Math.abs(vel) > 5) {
          dir = vel >= 0 ? -1 : 1;
        }
        scrollBoost = Math.min(4.2, Math.abs(vel) / 650);
        const targetSkew = Math.max(-9, Math.min(9, -vel / 320));
        currentSkew += (targetSkew - currentSkew) * 0.35;
      },
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    io.observe(band);

    let last = performance.now();
    let rafId = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (!inView) {
        last = now;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      scrollBoost *= Math.pow(0.06, dt);
      currentSkew *= Math.pow(0.04, dt);

      const speed = 3.8 + scrollBoost * 9.5; // % per second
      xPct += dir * speed * dt;
      if (xPct <= -50) xPct += 50;
      if (xPct > 0) xPct -= 50;

      track.style.transform = `translate3d(${xPct.toFixed(3)}%, 0, 0)`;
      skewEl.style.transform = `skewX(${currentSkew.toFixed(2)}deg)`;
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      st.kill();
      io.disconnect();
    };
  }, []);

  const renderGroup = (copyIdx) => (
    <div className="marquee-group" key={copyIdx} aria-hidden={copyIdx > 0}>
      {DATA.marqueeItems.map((item, idx) => (
        <span key={idx} className="marquee-unit">
          <span
            className={
              item.style === 'anton' ? 'marquee-item-anton' : 'marquee-item-serif'
            }
          >
            {item.text}
          </span>
          <span className="marquee-star" aria-hidden="true">
            ✦
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div ref={bandRef} className="marquee-band" aria-label="Highlights">
      <div ref={skewRef} className="marquee-skew">
        <div ref={trackRef} className="marquee-track">
          {renderGroup(0)}
          {renderGroup(1)}
        </div>
      </div>
    </div>
  );
}

