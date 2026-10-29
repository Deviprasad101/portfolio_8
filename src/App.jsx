import { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

import { DATA } from './data';
import { BG, preloadAllVideos } from './lib/videoStore';

import CustomCursor from './components/CustomCursor';
import Preloader from './components/Preloader';
import Hero from './components/Hero';
import About from './components/About';
import Numbers from './components/Numbers';
import Marquee from './components/Marquee';
import Work from './components/Work';
import Skills from './components/Skills';
import Journey from './components/Journey';
import Certifications from './components/Certifications';
import Contact from './components/Contact';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [loadProgress, setLoadProgress] = useState(0);
  const [videosLoaded, setVideosLoaded] = useState(false);
  const [preloaderDone, setPreloaderDone] = useState(false);
  const lenisRef = useRef(null);

  // Sync page title & dynamic video BG token
  useEffect(() => {
    document.title = `${DATA.fullName} — ${DATA.role}`;
    document.documentElement.style.setProperty('--video-bg', BG || '#f5f3ef');
  }, []);

  // Preload all 4 character videos on startup
  useEffect(() => {
    let mounted = true;
    preloadAllVideos((p) => {
      if (mounted) setLoadProgress(p);
    }).then(() => {
      if (mounted) {
        setLoadProgress(1);
        setVideosLoaded(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize Lenis smooth scroll (duration 1.15, expo-out, driven by gsap.ticker, stopped until preloader ends)
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      document.documentElement.classList.add('reduced-motion');
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });
    lenisRef.current = lenis;

    // Stopped until preloader completes
    lenis.stop();
    document.documentElement.classList.add('is-locked');

    lenis.on('scroll', ScrollTrigger.update);

    const tickerFn = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerFn);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerFn);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const handlePreloaderComplete = useCallback(() => {
    setPreloaderDone(true);
    document.documentElement.classList.remove('is-locked');
    if (lenisRef.current) {
      lenisRef.current.start();
    }
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  const handleNavigate = useCallback((target) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, { offset: 0, duration: 1.25 });
    } else {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleBackToTop = useCallback(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { duration: 1.35 });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <>
      {/* GPU SVG Unsharp-Mask filter for ultra-crisp video character rendering */}
      <svg
        width="0"
        height="0"
        style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <filter id="char-crisp" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.95" result="soft" />
            <feComposite
              in="SourceGraphic"
              in2="soft"
              operator="arithmetic"
              k1="0"
              k2="1.62"
              k3="-0.62"
              k4="0"
            />
          </filter>
        </defs>
      </svg>

      {/* Fixed film-grain noise overlay at opacity .06 */}
      <div className="film-grain" aria-hidden="true" />

      {/* Custom cursor (hidden on touch) */}
      <CustomCursor />

      {/* Preloader */}
      <Preloader
        progress={loadProgress}
        loaded={videosLoaded}
        onComplete={handlePreloaderComplete}
      />

      <main className="site-main">
        <Hero ready={preloaderDone} onNavigate={handleNavigate} />
        <About />
        <Numbers />
        <Marquee />
        <Work />
        <Skills />
        <Journey />
        <Certifications />
        <Contact onBackToTop={handleBackToTop} />
      </main>
    </>
  );
}
