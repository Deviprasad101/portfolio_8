import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import { VIDEO_TIMING, drawWaveCutoutOnDark, getVideos } from '../lib/videoStore';

gsap.registerPlugin(ScrollTrigger);

export default function Contact({ onBackToTop }) {
  const sectionRef = useRef(null);
  const bgWordRef = useRef(null);
  const leftLinesRef = useRef(null);
  const canvasRef = useRef(null);

  // Size "LET'S TALK" in JS so it spans 96% of section width without stretching
  useEffect(() => {
    const section = sectionRef.current;
    const word = bgWordRef.current;
    if (!section || !word) return;

    const fitWord = () => {
      const targetW = section.clientWidth * 0.96;
      if (targetW <= 0) return;
      word.style.fontSize = '100px';
      const measured = word.scrollWidth || word.getBoundingClientRect().width;
      if (measured > 0) {
        const exactPx = (targetW / measured) * 100;
        word.style.fontSize = `${exactPx.toFixed(2)}px`;
      }
    };

    fitWord();
    const ro = new ResizeObserver(fitWord);
    ro.observe(section);
    if (document.fonts?.ready) {
      document.fonts.ready.then(fitWord);
    }

    return () => ro.disconnect();
  }, []);

  // Lower-left 3 lines slide up into view
  useEffect(() => {
    const wrap = leftLinesRef.current;
    if (!wrap) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lines = wrap.querySelectorAll('.contact-slide-inner');
    const anim = gsap.fromTo(
      lines,
      { yPercent: 105, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: {
          trigger: wrap,
          start: 'top 90%',
          toggleActions: 'play none none reverse',
        },
      }
    );

    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  // Cutout wave character canvas (48% of screen height, looping wave, paused off-screen, NO glow/smoke)
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let dpr = Math.max(window.devicePixelRatio || 1, 2);
    let ch = Math.round(window.innerHeight * 0.48);
    let cw = Math.round(ch * (640 / 1080));

    const resize = () => {
      dpr = Math.max(window.devicePixelRatio || 1, 2);
      const vh = window.innerHeight || 860;
      const isMobile = window.innerWidth < 768;
      ch = Math.round(vh * (isMobile ? 0.4 : 0.48));
      cw = Math.round(ch * (640 / 1080));
      canvas.width = Math.round(cw * dpr);
      canvas.height = Math.round(ch * dpr);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        const vid = getVideos().contactWave;
        if (!vid) return;
        if (inView && !reduced) {
          vid.play().catch(() => {});
        } else {
          vid.pause();
        }
      },
      { threshold: 0.02 }
    );
    io.observe(section);

    let rafId = 0;
    const tick = () => {
      rafId = requestAnimationFrame(tick);
      if (!inView) return;

      const vid = getVideos().contactWave;
      if (!vid) return;

      if (reduced) {
        if (!vid.paused) vid.pause();
        if (Math.abs(vid.currentTime - 1.8) > 0.1 && !vid.seeking) {
          vid.currentTime = 1.8;
        }
      } else {
        if (vid.paused) vid.play().catch(() => {});
        if (vid.currentTime >= VIDEO_TIMING.wave.firstWaveEnd) {
          vid.currentTime = 0.02;
        }
      }

      drawWaveCutoutOnDark(ctx, vid, cw, ch, dpr);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      const vid = getVideos().contactWave;
      if (vid && !vid.paused) vid.pause();
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <footer id="contact" ref={sectionRef} className="contact-section">
      {/* Giant JS-sized 96%-width background Anton watermark */}
      <div className="contact-bg-wrap" aria-hidden="true">
        <span ref={bgWordRef} className="contact-bg-word">
          LET&apos;S TALK
        </span>
      </div>

      <div className="container contact-main-grid">
        {/* Lower left: exact 3 lines */}
        <div ref={leftLinesRef} className="contact-left">
          <h2 className="contact-three-lines">
            <span className="contact-slide-mask">
              <span className="contact-slide-inner">Let&apos;s build</span>
            </span>
            <span className="contact-slide-mask">
              <span className="contact-slide-inner">something</span>
            </span>
            <span className="contact-slide-mask">
              <em className="contact-slide-inner is-serif">that moves.</em>
            </span>
          </h2>
        </div>

        {/* Centre: cutout character waving + small glass "Bye for now!" bubble (NO glow or smoke) */}
        <div className="contact-center">
          <div className="contact-char-wrap">
            <canvas
              ref={canvasRef}
              className="contact-char-canvas"
              aria-label={`${DATA.firstName} waving goodbye`}
            />
            <div className="contact-bye-bubble">Bye for now!</div>
          </div>
        </div>

        {/* Lower right: three 44px round outline icon buttons */}
        <div className="contact-right">
          <div className="contact-icon-row">
            <a
              href={DATA.github}
              target="_blank"
              rel="noreferrer"
              className="contact-icon-btn"
              aria-label="GitHub"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.39-3.88-1.39-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11.02 11.02 0 0 1 5.78 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.24 2.76.12 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.42.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
              </svg>
            </a>

            <a
              href={DATA.linkedin}
              target="_blank"
              rel="noreferrer"
              className="contact-icon-btn"
              aria-label="LinkedIn"
              title="LinkedIn"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
                <path d="M4.98 3.5a2.49 2.49 0 1 1 0 4.98 2.49 2.49 0 0 1 0-4.98ZM3 9.75h3.96V21H3V9.75Zm6.24 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.76 2.64 4.76 6.07V21h-3.96v-5.04c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.66V21H9.24V9.75Z" />
              </svg>
            </a>

            <a
              href={`mailto:${DATA.email}`}
              className="contact-icon-btn"
              aria-label="Email"
              title={DATA.email}
            >
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2.75" y="4.75" width="18.5" height="14.5" rx="2.5" />
                <path d="m3.5 6.5 8.5 6.25L20.5 6.5" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Thin footer with ONLY copyright and Back to top */}
      <div className="contact-thin-footer">
        <div className="container contact-footer-inner">
          <span>
            © {DATA.year} {DATA.fullName}
          </span>
          <button
            type="button"
            className="back-to-top-btn"
            onClick={() => onBackToTop?.()}
          >
            Back to top ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
