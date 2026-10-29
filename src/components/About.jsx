import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import {
  VIDEO_TIMING,
  drawImageCenterCrop,
  drawVideoCenterCrop,
  getVideos,
  seekSmooth,
} from '../lib/videoStore';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const leftHeadRef = useRef(null);
  const rightSentRef = useRef(null);
  const [chapterIdx, setChapterIdx] = useState(0);

  // Scroll-scrubbed 360 uncut turn_360 video + ultra-HD character.png front anchor
  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Supersample backing store (>= 2.25x) so 1080p video + high-res character.png stay razor-sharp on any DPI
    let renderScale = Math.max(window.devicePixelRatio || 1, 2.25);
    let cw = 800;
    let ch = 1080;

    const resize = () => {
      renderScale = Math.max(window.devicePixelRatio || 1, 2.25);
      const vh = window.innerHeight || 900;
      // Slight breathing room at top so head is framed cleanly and pixels aren't over-magnified
      ch = Math.round(vh * 0.96);
      cw = Math.round(ch * (800 / 1080));
      canvas.width = Math.round(cw * renderScale);
      canvas.height = Math.round(ch * renderScale);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    };
    resize();
    window.addEventListener('resize', resize);

    let targetP = 0;
    let smoothP = 0;
    let inView = false;
    let currentChap = 0;

    const st = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        const p = Math.min(1, Math.max(0, self.progress / 0.9));
        targetP = p;
        const nextChap = Math.min(3, Math.floor(p * 4));
        if (nextChap !== currentChap) {
          currentChap = nextChap;
          setChapterIdx(nextChap);
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
    const render = () => {
      rafId = requestAnimationFrame(render);
      if (!inView) return;

      if (reduced) {
        smoothP = targetP;
      } else {
        smoothP += (targetP - smoothP) * 0.16;
      }

      const store = getVideos();
      const vid = store.aboutTurn;
      const poster = store.posterImg;

      // Blend weight for lossless ultra-HD character.png at front-facing start (0..0.055) and end (0.94..1.0)
      let posterAlpha = 0;
      if (smoothP < 0.055) {
        posterAlpha = 1 - smoothP / 0.055;
      } else if (smoothP > 0.94) {
        posterAlpha = (smoothP - 0.94) / 0.06;
      }
      posterAlpha = Math.max(0, Math.min(1, posterAlpha));

      if (vid) {
        const tStart = VIDEO_TIMING.turn.aboutStart;
        const tEnd = VIDEO_TIMING.turn.aboutEnd;
        const desiredTime = tStart + smoothP * (tEnd - tStart);
        seekSmooth(vid, desiredTime);
      }

      const canDrawVid = vid && !vid.seeking && vid.readyState >= 2;
      if (!canDrawVid && posterAlpha < 0.99) {
        // Keep last crisp rendered frame on canvas while hardware decoder finishes seek
        return;
      }

      ctx.save();
      ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, cw, ch);

      // Match background white-point to pure white so multiply blend leaves zero box seam
      ctx.filter = 'brightness(1.036) contrast(1.032)';

      if (canDrawVid && posterAlpha < 0.999) {
        ctx.globalAlpha = 1;
        drawVideoCenterCrop(ctx, vid, 0, 0, cw, ch, 800 / 1080);
      }

      if (poster && posterAlpha > 0.005) {
        ctx.globalAlpha = canDrawVid ? posterAlpha : 1;
        drawImageCenterCrop(ctx, poster, 0, 0, cw, ch, 800 / 1080);
      }

      ctx.restore();
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      st.kill();
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Animate heading lines rising + sentence words fading from blur on every chapter change
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const lines = leftHeadRef.current?.querySelectorAll('.about-rise-line') || [];
    const words = rightSentRef.current?.querySelectorAll('.about-blur-word') || [];

    gsap.killTweensOf(lines);
    gsap.killTweensOf(words);

    gsap.fromTo(
      lines,
      { yPercent: 100, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.65,
        stagger: 0.07,
        ease: 'expo.out',
      }
    );

    gsap.fromTo(
      words,
      { opacity: 0, filter: 'blur(8px)', y: 8 },
      {
        opacity: 1,
        filter: 'blur(0px)',
        y: 0,
        duration: 0.55,
        stagger: 0.028,
        ease: 'power3.out',
      }
    );
  }, [chapterIdx]);

  const chap = DATA.aboutChapters[chapterIdx];
  const words = chap.sentence.split(' ');

  return (
    <section id="about" ref={sectionRef} className="about-section">
      <div className="about-sticky">
        <div className="about-canvas-wrap" aria-hidden="true">
          <canvas ref={canvasRef} className="about-rotc-canvas" />
        </div>

        <div className="about-grid">
          <div className="about-col is-left">
            <div className="eyebrow-label is-light-theme is-right-aligned">
              <span className="eyebrow-line" aria-hidden="true" />
              <span>{chap.label}</span>
            </div>

            <h2 ref={leftHeadRef} className="about-heading" key={`h-${chapterIdx}`}>
              <span className="about-line-mask">
                <span className="about-rise-line">{chap.line1}</span>
              </span>
              <span className="about-line-mask">
                <em className="about-rise-line about-heading-italic">{chap.line2}</em>
              </span>
            </h2>

            <div className="about-outline-pill">{chap.pill}</div>
          </div>

          <div className="about-col is-center" aria-hidden="true" />

          <div className="about-col is-right">
            <p ref={rightSentRef} className="about-sentence" key={`s-${chapterIdx}`}>
              {words.map((w, i) => (
                <span key={i} className="about-blur-word">
                  {w}
                  {i < words.length - 1 ? '\u00A0' : ''}
                </span>
              ))}
            </p>

            <div className="about-dashes" role="tablist" aria-label="About chapters">
              {DATA.aboutChapters.map((c, idx) => (
                <span
                  key={c.label}
                  className={`about-dash ${idx === chapterIdx ? 'is-active' : ''}`}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
