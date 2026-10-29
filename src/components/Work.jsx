import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import SectionHeader from './SectionHeader';
import WorkVisual from './WorkVisual';

gsap.registerPlugin(ScrollTrigger);

const AUTO_DURATION = 8; // seconds

export default function Work() {
  const sectionRef = useRef(null);
  const browserRef = useRef(null);
  const middleRef = useRef(null);
  const visualWrapRef = useRef(null);
  const progressRefs = useRef([]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const inViewRef = useRef(false);
  const elapsedRef = useRef(0);

  const projects = DATA.projects;
  const current = projects[activeIdx];

  const switchTab = useCallback(
    (nextIdx) => {
      const wrapped = (nextIdx + projects.length) % projects.length;
      elapsedRef.current = 0;
      progressRefs.current.forEach((bar, i) => {
        if (bar) bar.style.transform = i === wrapped ? 'scaleX(0)' : 'scaleX(0)';
      });
      setActiveIdx(wrapped);
    },
    [projects.length]
  );

  // Browser window tilts up into place on scroll
  useEffect(() => {
    const browser = browserRef.current;
    if (!browser) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const anim = gsap.fromTo(
      browser,
      { rotateX: 11, y: 54, transformPerspective: 1400, transformOrigin: '50% 100%' },
      {
        rotateX: 0,
        y: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: browser,
          start: 'top 92%',
          end: 'top 42%',
          scrub: true,
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  // Track visibility & pause auto-advance off-screen
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.15 }
    );
    io.observe(section);
    return () => io.disconnect();
  }, []);

  // 8-second auto-advance progress bar loop
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let last = performance.now();
    let rafId = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!playing || !inViewRef.current || reduced) return;

      elapsedRef.current += dt;
      const ratio = Math.min(1, elapsedRef.current / AUTO_DURATION);
      const activeBar = progressRefs.current[activeIdx];
      if (activeBar) {
        activeBar.style.transform = `scaleX(${ratio.toFixed(4)})`;
      }

      if (elapsedRef.current >= AUTO_DURATION) {
        elapsedRef.current = 0;
        switchTab(activeIdx + 1);
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeIdx, playing, switchTab]);

  // Content fades in from blur & visual wipes down on tab change
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    if (middleRef.current) {
      gsap.fromTo(
        middleRef.current,
        { opacity: 0, filter: 'blur(10px)', y: 12 },
        { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.55, ease: 'power3.out' }
      );
    }
    if (visualWrapRef.current) {
      gsap.fromTo(
        visualWrapRef.current,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.65, ease: 'expo.out' }
      );
    }
  }, [activeIdx]);

  // Arrow keys switch manually when focused inside section
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      switchTab(activeIdx + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      switchTab(activeIdx - 1);
    }
  };

  const countText = `${String(activeIdx + 1).padStart(2, '0')} / ${String(
    projects.length
  ).padStart(2, '0')}`;

  return (
    <section
      id="work"
      ref={sectionRef}
      className="work-section"
      onKeyDown={onKeyDown}
    >
      <div className="container">
        <SectionHeader
          label="04 — Selected work"
          titleLead="Things I've"
          titleAccent="built"
          theme="light"
        />

        <div ref={browserRef} className="work-browser">
          {/* Browser Tabs */}
          <div className="work-tabs-bar" role="tablist" aria-label="Projects">
            <div className="work-traffic-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </div>

            <div className="work-tabs-list">
              {projects.map((proj, idx) => {
                const isAct = idx === activeIdx;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    role="tab"
                    aria-selected={isAct}
                    className={`work-tab ${isAct ? 'is-active' : ''}`}
                    onClick={() => switchTab(idx)}
                  >
                    <span className="work-tab-num">0{idx + 1}</span>
                    <span className="work-tab-title">
                      {proj.titleMain} {proj.titleItalic}
                    </span>
                    <span className="work-tab-progress-track" aria-hidden="true">
                      <span
                        ref={(el) => {
                          progressRefs.current[idx] = el;
                        }}
                        className="work-tab-progress-fill"
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Browser Address Bar */}
          <div className="work-address-bar">
            <div className="work-url-box">
              <span className="work-url-lock" aria-hidden="true">
                https://
              </span>
              <span className="work-url-text">
                github.com/{DATA.githubHandle}/{current.repoName}
              </span>
            </div>

            <button
              type="button"
              className="work-play-pill"
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? 'Pause auto tab rotation' : 'Play auto tab rotation'}
            >
              <span className={`work-play-dot ${playing ? 'is-playing' : ''}`} />
              <span>{playing ? 'Pause' : 'Play'}</span>
            </button>
          </div>

          {/* Browser 3-column Body */}
          <div className="work-body">
            {/* Left sidebar: stack list */}
            <aside className="work-sidebar" aria-label="Project stack">
              <div className="work-sidebar-label">TECH STACK</div>
              <ul className="work-stack-list">
                {current.tech.map((t) => (
                  <li key={t} className="work-stack-item">
                    <span className="work-stack-bullet" aria-hidden="true" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Middle: category, Anton + Serif title, description, Open repository pill + counter */}
            <div ref={middleRef} className="work-middle" key={`m-${current.id}`}>
              <div className="work-category-label">{current.category}</div>

              <h3 className="work-proj-title">
                <span>{current.titleMain} </span>
                <em className="work-proj-italic">{current.titleItalic}</em>
              </h3>

              <p className="work-proj-desc">{current.description}</p>

              <div className="work-middle-footer">
                <a
                  href={current.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pill-btn is-charcoal"
                  data-cursor="OPEN"
                >
                  Open repository ↗
                </a>
                <span className="work-counter-mono">{countText}</span>
              </div>
            </div>

            {/* Right: dark rounded screen with live monochrome visual */}
            <div className="work-screen-outer">
              <div
                ref={visualWrapRef}
                className="work-dark-screen"
                key={`v-${current.id}`}
                data-cursor="OPEN"
              >
                <WorkVisual project={current} active={playing} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

