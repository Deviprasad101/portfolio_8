import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import SectionHeader from './SectionHeader';

gsap.registerPlugin(ScrollTrigger);

const STEP_DEG = 30;

export default function Journey() {
  const sectionRef = useRef(null);
  const ringRef = useRef(null);
  const [activeStop, setActiveStop] = useState(0);

  const milestones = DATA.journey;
  const count = milestones.length;

  useEffect(() => {
    const section = sectionRef.current;
    const ring = ringRef.current;
    if (!section || !ring) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let targetAngle = 0;
    let currentAngle = 0;
    let inView = false;
    let lastStop = 0;

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = self.progress;
        targetAngle = -p * ((count - 1) * STEP_DEG);
        const nearest = Math.min(count - 1, Math.max(0, Math.round(p * (count - 1))));
        if (nearest !== lastStop) {
          lastStop = nearest;
          setActiveStop(nearest);
        }
      },
    });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
      },
      { threshold: 0.01 }
    );
    io.observe(section);

    let rafId = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (!inView) return;

      if (reduced) {
        currentAngle = targetAngle;
      } else {
        currentAngle += (targetAngle - currentAngle) * 0.14;
      }

      ring.style.transform = `translateZ(calc(-1 * var(--ring-z))) rotateY(${currentAngle.toFixed(
        3
      )}deg)`;
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      st.kill();
      io.disconnect();
    };
  }, [count]);

  const stopCaption = `Stop ${String(activeStop + 1).padStart(2, '0')} of ${String(
    count
  ).padStart(2, '0')}`;

  return (
    <section
      id="journey"
      ref={sectionRef}
      className="journey-section"
      style={{ height: `calc(100vh + ${count * 60}vh)` }}
    >
      <div className="journey-sticky">
        <div className="container journey-header-wrap">
          <SectionHeader
            label="06 — Journey"
            titleLead="The road"
            titleAccent="so far"
            theme="dark"
          />
        </div>

        <div className="journey-stage">
          <div ref={ringRef} className="journey-ring">
            {milestones.map((ms, idx) => {
              const isAct = idx === activeStop;
              return (
                <article
                  key={`${ms.year}-${ms.title}`}
                  className={`journey-card ${isAct ? 'is-active' : ''}`}
                  style={{
                    transform: `rotateY(${idx * STEP_DEG}deg) translateZ(var(--ring-z))`,
                  }}
                >
                  <div className="journey-card-top">
                    <span className="journey-card-idx">0{idx + 1}</span>
                    <span className="journey-meta-pill">{ms.meta}</span>
                  </div>

                  <div className="journey-year">{ms.year}</div>
                  <h3 className="journey-title">{ms.title}</h3>
                  <div className="journey-place">{ms.place}</div>
                  <p className="journey-detail">{ms.detail}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="journey-caption-bar">
          <span className="journey-caption-text">{stopCaption}</span>
          <div className="journey-dots" aria-hidden="true">
            {milestones.map((_, i) => (
              <span
                key={i}
                className={`journey-dot ${i === activeStop ? 'is-active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

