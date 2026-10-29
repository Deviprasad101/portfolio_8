import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { DATA } from '../data';
import {
  VIDEO_TIMING,
  drawVideoCenterCrop,
  getVideos,
  seekSmooth,
} from '../lib/videoStore';
import Navbar from './Navbar';

export default function Hero({ ready, onNavigate }) {
  const sectionRef = useRef(null);
  const giantWrapRef = useRef(null);
  const giantInnerRef = useRef(null);
  const charStageRef = useRef(null);
  const charCanvasRef = useRef(null);
  const dustCanvasRef = useRef(null);
  const shadowRef = useRef(null);
  const bubbleRef = useRef(null);
  const floorLineRef = useRef(null);
  const leftNoteRef = useRef(null);
  const rightNoteRef = useRef(null);
  const bottomContentRef = useRef(null);

  const [bubbleText, setBubbleText] = useState(DATA.heroBubbles[0]);
  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [bubbleFlipLeft, setBubbleFlipLeft] = useState(false);

  const readyRef = useRef(ready);
  readyRef.current = ready;

  // Uniformly fit giant background first name inside 92vw so it never causes overflow or clipping
  useEffect(() => {
    const fitGiant = () => {
      const inner = giantInnerRef.current;
      if (!inner) return;
      inner.style.transform = 'scale(1)';
      const naturalW = inner.scrollWidth;
      const maxW = window.innerWidth * 0.92;
      if (naturalW > maxW && naturalW > 0) {
        inner.style.transform = `scale(${maxW / naturalW})`;
      }
    };
    fitGiant();
    window.addEventListener('resize', fitGiant);
    if (document.fonts?.ready) {
      document.fonts.ready.then(fitGiant);
    }
    return () => window.removeEventListener('resize', fitGiant);
  }, []);

  // Intro animation after preloader finishes
  useEffect(() => {
    if (!ready) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const letters = giantInnerRef.current?.querySelectorAll('.hero-giant-letter') || [];

    if (reduced) {
      gsap.set([letters, charStageRef.current, floorLineRef.current, bottomContentRef.current], {
        clearProps: 'all',
        opacity: 1,
      });
      return;
    }

    const tl = gsap.timeline();
    tl.fromTo(
      floorLineRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1, duration: 0.95, ease: 'expo.out' },
      0
    )
      .fromTo(
        letters,
        { yPercent: 62, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 1.0,
          stagger: 0.035,
          ease: 'expo.out',
        },
        0.06
      )
      .fromTo(
        charStageRef.current,
        { y: 40, opacity: 0, filter: 'blur(16px)' },
        { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.05, ease: 'expo.out' },
        0.14
      )
      .fromTo(
        bottomContentRef.current,
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'expo.out' },
        0.26
      );

    return () => tl.kill();
  }, [ready]);

  // Interactive character canvas loop driven directly by wave, turn_360, run_right, and run_left videos
  useEffect(() => {
    const section = sectionRef.current;
    const charCanvas = charCanvasRef.current;
    const dustCanvas = dustCanvasRef.current;
    const stageEl = charStageRef.current;
    const shadowEl = shadowRef.current;
    const bubbleEl = bubbleRef.current;
    if (!section || !charCanvas || !dustCanvas || !stageEl) return;

    const ctx = charCanvas.getContext('2d');
    const dustCtx = dustCanvas.getContext('2d');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Offscreen snapshot buffer for seamless 0.14s state-change crossfades
    const snapCanvas = document.createElement('canvas');
    const snapCtx = snapCanvas.getContext('2d');

    let heroW = section.clientWidth || window.innerWidth;
    let heroH = section.clientHeight || window.innerHeight;
    let charH = Math.min(860, heroH * (heroW < 768 ? 0.56 : 0.72));
    let charW = charH * (640 / 1080);
    let canvasW = Math.round(charW * 1.24);
    let canvasH = Math.round(charH);
    let dpr = Math.max(window.devicePixelRatio || 1, 2);

    const state = {
      x: heroW * 0.5,
      targetX: heroW * 0.5,
      vel: 0,
      lean: 0,
      dir: 1, // 1 -> right (run_right.mp4), -1 -> left (run_left.mp4)
      mode: 'idle_pre', // 'idle_pre' | 'wave' | 'idle' | 'turn_out' | 'run_start' | 'run' | 'run_stop' | 'turn_in'
      modeTime: 0,
      idleTime: 0,
      bubbleIdx: 0,
      flipTimer: 0,
      fadeTimer: 0,
      hasSnap: false,
      dustSpawnAcc: 0,
      dust: [],
      inView: true,
      startedIntroWave: false,
    };

    const pauseAllHeroVideos = () => {
      const vids = getVideos();
      [vids.heroWave, vids.heroRunRight, vids.heroRunLeft, vids.heroTurn].forEach((v) => {
        if (v && !v.paused) v.pause();
      });
    };

    const captureSnapshot = () => {
      if (charCanvas.width > 0 && charCanvas.height > 0) {
        snapCanvas.width = charCanvas.width;
        snapCanvas.height = charCanvas.height;
        snapCtx.clearRect(0, 0, snapCanvas.width, snapCanvas.height);
        snapCtx.drawImage(charCanvas, 0, 0);
        state.hasSnap = true;
        state.fadeTimer = reduced ? 0 : 0.14;
      }
    };

    const playSafe = (v, startTime, rate = 1) => {
      if (!v) return;
      try {
        if (typeof startTime === 'number') {
          v.currentTime = startTime;
        }
        v.playbackRate = Math.max(0.25, Math.min(3, rate));
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      } catch {
        // ignore
      }
    };

    const transitionTo = (nextMode) => {
      if (state.mode === nextMode) return;
      captureSnapshot();
      pauseAllHeroVideos();

      state.mode = nextMode;
      state.modeTime = 0;

      const vids = getVideos();
      if (nextMode === 'wave') {
        const isFirst = !state.startedIntroWave;
        state.startedIntroWave = true;
        if (isFirst) {
          state.bubbleIdx = 0;
          setBubbleText(DATA.heroBubbles[0]);
        } else {
          state.bubbleIdx = (state.bubbleIdx + 1) % DATA.heroBubbles.length;
          setBubbleText(DATA.heroBubbles[state.bubbleIdx]);
        }
        setBubbleVisible(true);
        playSafe(vids.heroWave, 0.02, 26 / 24);
      } else {
        setBubbleVisible(false);
        if (nextMode === 'idle') {
          seekSmooth(vids.heroWave, 0.02);
        } else if (nextMode === 'run_start') {
          const cfg = state.dir > 0 ? VIDEO_TIMING.runRight : VIDEO_TIMING.runLeft;
          const runVid = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
          const speedRate = (cfg.startTo - cfg.startFrom) / 0.3;
          playSafe(runVid, cfg.startFrom, speedRate);
        } else if (nextMode === 'run') {
          const cfg = state.dir > 0 ? VIDEO_TIMING.runRight : VIDEO_TIMING.runLeft;
          const runVid = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
          playSafe(runVid, cfg.loopFrom, 1.0);
        }
      }
    };

    const updateLayout = () => {
      heroW = section.clientWidth || window.innerWidth;
      heroH = section.clientHeight || window.innerHeight;
      const isMobile = heroW < 768;
      charH = Math.min(860, heroH * (isMobile ? 0.56 : 0.72));
      charW = charH * (640 / 1080);
      canvasW = Math.round(charW * 1.24);
      canvasH = Math.round(charH);
      dpr = Math.max(window.devicePixelRatio || 1, 2);

      charCanvas.width = Math.round(canvasW * dpr);
      charCanvas.height = Math.round(canvasH * dpr);
      charCanvas.style.width = `${canvasW}px`;
      charCanvas.style.height = `${canvasH}px`;
      stageEl.style.bottom = `${-Math.round(canvasH * 0.026)}px`;

      dustCanvas.width = Math.round(heroW * dpr);
      dustCanvas.height = Math.round(100 * dpr);
      dustCanvas.style.width = `${heroW}px`;
      dustCanvas.style.height = '100px';

      const margin = Math.max(76, charW * 0.42);
      state.x = Math.max(margin, Math.min(heroW - margin, state.x));
      state.targetX = Math.max(margin, Math.min(heroW - margin, state.targetX));
    };

    updateLayout();

    const setPointerTarget = (clientX) => {
      if (!readyRef.current) return;
      const rect = section.getBoundingClientRect();
      const localX = clientX - rect.left;
      const margin = Math.max(76, charW * 0.42);
      state.targetX = Math.max(margin, Math.min(heroW - margin, localX));
    };

    const onPointerMove = (e) => {
      if (e.pointerType === 'touch') return;
      setPointerTarget(e.clientX);
    };
    const onTouch = (e) => {
      if (e.touches && e.touches.length > 0) {
        setPointerTarget(e.touches[0].clientX);
      }
    };

    section.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('touchstart', onTouch, { passive: true });
    section.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('resize', updateLayout);

    const io = new IntersectionObserver(
      ([entry]) => {
        state.inView = entry.isIntersecting;
        if (!state.inView) {
          pauseAllHeroVideos();
        } else if (state.mode === 'run') {
          const vids = getVideos();
          const rv = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
          playSafe(rv);
        } else if (state.mode === 'wave') {
          playSafe(getVideos().heroWave);
        }
      },
      { threshold: 0.01 }
    );
    io.observe(section);

    let lastNow = performance.now();
    let rafId = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (!state.inView) {
        lastNow = now;
        return;
      }

      const dt = Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;
      const vids = getVideos();

      if (readyRef.current && state.mode === 'idle_pre' && vids.heroWave) {
        transitionTo('wave');
      }

      state.modeTime += dt;
      if (state.fadeTimer > 0) {
        state.fadeTimer = Math.max(0, state.fadeTimer - dt);
      }
      if (state.flipTimer > 0) {
        state.flipTimer = Math.max(0, state.flipTimer - dt);
      }

      const dist = state.targetX - state.x;
      const absDist = Math.abs(dist);
      const margin = Math.max(76, charW * 0.42);
      const maxSpeed = Math.min(980, Math.max(420, heroW * 0.62));

      let activeVideo = vids.heroWave;
      let mirrorVideo = false;

      if (state.mode === 'idle_pre') {
        activeVideo = vids.heroWave;
      } else if (state.mode === 'wave') {
        activeVideo = vids.heroWave;
        if (absDist > 50 && !reduced) {
          state.dir = dist >= 0 ? 1 : -1;
          transitionTo('turn_out');
        } else if (absDist > 50 && reduced) {
          state.x = state.targetX;
        } else if (
          (vids.heroWave && vids.heroWave.currentTime >= VIDEO_TIMING.wave.firstWaveEnd) ||
          state.modeTime >= 3.7
        ) {
          state.idleTime = 0;
          transitionTo('idle');
        }
      } else if (state.mode === 'idle') {
        activeVideo = vids.heroWave;
        state.idleTime += dt;
        if (absDist > 50 && !reduced) {
          state.dir = dist >= 0 ? 1 : -1;
          transitionTo('turn_out');
        } else if (absDist > 50 && reduced) {
          state.x = state.targetX;
          transitionTo('wave');
        } else if (state.idleTime >= 6.5) {
          transitionTo('wave');
        }
      }

      if (state.mode === 'turn_out') {
        const dur = 0.26;
        const p = Math.min(1, state.modeTime / dur);
        if (absDist > 20) {
          state.dir = dist >= 0 ? 1 : -1;
        }
        activeVideo = vids.heroTurn;
        if (state.dir < 0) {
          const t =
            VIDEO_TIMING.turn.leftFront +
            (VIDEO_TIMING.turn.leftProfile - VIDEO_TIMING.turn.leftFront) * p;
          seekSmooth(vids.heroTurn, t);
          mirrorVideo = false;
        } else {
          const t =
            VIDEO_TIMING.turn.rightFront +
            (VIDEO_TIMING.turn.rightProfile - VIDEO_TIMING.turn.rightFront) * p;
          seekSmooth(vids.heroTurn, t);
          mirrorVideo = true;
        }
        state.lean += (0 - state.lean) * (1 - Math.exp(-12 * dt));
        if (p >= 1) {
          transitionTo('run_start');
        }
      } else if (state.mode === 'run_start') {
        const dur = 0.3;
        const p = Math.min(1, state.modeTime / dur);
        activeVideo = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
        mirrorVideo = false;

        const desiredSpeed = Math.min(maxSpeed, absDist * 3.4) * (0.38 + 0.62 * p);
        const desiredVel = Math.sign(dist) * desiredSpeed;
        state.vel += (desiredVel - state.vel) * (1 - Math.exp(-9 * dt));
        state.x = Math.max(margin, Math.min(heroW - margin, state.x + state.vel * dt));
        const targetLean = (state.vel / maxSpeed) * 2.2;
        state.lean += (targetLean - state.lean) * (1 - Math.exp(-10 * dt));

        if (Math.abs(state.targetX - state.x) <= 14) {
          transitionTo('run_stop');
        } else if (p >= 1) {
          transitionTo('run');
        }
      } else if (state.mode === 'run') {
        // Flip between run_right.mp4 and run_left.mp4 with 0.2s squash if pointer crosses sides
        if ((dist > 18 && state.dir < 0) || (dist < -18 && state.dir > 0)) {
          captureSnapshot();
          pauseAllHeroVideos();
          state.dir = dist >= 0 ? 1 : -1;
          state.flipTimer = 0.2;
          const nextCfg = state.dir > 0 ? VIDEO_TIMING.runRight : VIDEO_TIMING.runLeft;
          const nextVid = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
          playSafe(nextVid, nextCfg.loopFrom, 1.0);
        }

        const cfg = state.dir > 0 ? VIDEO_TIMING.runRight : VIDEO_TIMING.runLeft;
        const runVid = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
        activeVideo = runVid;
        mirrorVideo = false;

        const desiredSpeed = Math.min(maxSpeed, absDist * 3.4);
        const desiredVel = Math.sign(dist) * desiredSpeed;
        state.vel += (desiredVel - state.vel) * (1 - Math.exp(-11 * dt));
        state.x = Math.max(margin, Math.min(heroW - margin, state.x + state.vel * dt));

        const speedNorm = Math.min(1, Math.abs(state.vel) / maxSpeed);
        const rateScale = 0.75 + speedNorm * (1.55 - 0.75);

        if (runVid) {
          if (Math.abs(runVid.playbackRate - rateScale) > 0.03) {
            runVid.playbackRate = rateScale;
          }
          if (runVid.paused) {
            playSafe(runVid);
          }
          // Seamless loop wrap with 0.14s crossfade
          if (runVid.currentTime >= cfg.loopTo) {
            captureSnapshot();
            runVid.currentTime = cfg.loopFrom;
          }
        }

        const targetLean = (state.vel / maxSpeed) * 2.2;
        state.lean += (targetLean - state.lean) * (1 - Math.exp(-12 * dt));

        // Dust puffs kicked up behind heels
        if (Math.abs(state.vel) > 105 && !reduced) {
          state.dustSpawnAcc += dt * rateScale;
          if (state.dustSpawnAcc >= 0.11) {
            state.dustSpawnAcc = 0;
            for (let k = 0; k < 2; k++) {
              state.dust.push({
                x: state.x - state.dir * (10 + Math.random() * 16),
                y: 86 - Math.random() * 6,
                vx: -state.dir * (22 + Math.random() * 34),
                vy: -(14 + Math.random() * 20),
                r: 3.5 + Math.random() * 3.5,
                age: 0,
                life: 0.42 + Math.random() * 0.18,
              });
            }
          }
        }

        if (Math.abs(state.targetX - state.x) <= 14) {
          transitionTo('run_stop');
        }
      } else if (state.mode === 'run_stop') {
        const dur = 0.3;
        const p = Math.min(1, state.modeTime / dur);
        const cfg = state.dir > 0 ? VIDEO_TIMING.runRight : VIDEO_TIMING.runLeft;
        const runVid = state.dir > 0 ? vids.heroRunRight : vids.heroRunLeft;
        activeVideo = runVid;
        mirrorVideo = false;
        const t = cfg.startTo + (cfg.startFrom - cfg.startTo) * p;
        seekSmooth(runVid, t);

        state.vel += (0 - state.vel) * (1 - Math.exp(-14 * dt));
        state.x = Math.max(margin, Math.min(heroW - margin, state.x + state.vel * dt));
        state.lean += (0 - state.lean) * (1 - Math.exp(-14 * dt));

        if (absDist > 50) {
          state.dir = dist >= 0 ? 1 : -1;
          transitionTo('run_start');
        } else if (p >= 1) {
          state.vel = 0;
          transitionTo('turn_in');
        }
      } else if (state.mode === 'turn_in') {
        const dur = 0.28;
        const p = Math.min(1, state.modeTime / dur);
        activeVideo = vids.heroTurn;
        if (state.dir < 0) {
          const t =
            VIDEO_TIMING.turn.leftProfile +
            (VIDEO_TIMING.turn.leftFront - VIDEO_TIMING.turn.leftProfile) * p;
          seekSmooth(vids.heroTurn, t);
          mirrorVideo = false;
        } else {
          const t =
            VIDEO_TIMING.turn.rightProfile +
            (VIDEO_TIMING.turn.rightFront - VIDEO_TIMING.turn.rightProfile) * p;
          seekSmooth(vids.heroTurn, t);
          mirrorVideo = true;
        }
        state.lean += (0 - state.lean) * (1 - Math.exp(-14 * dt));

        if (absDist > 50) {
          state.dir = dist >= 0 ? 1 : -1;
          transitionTo('turn_out');
        } else if (p >= 1) {
          transitionTo('wave');
        }
      }

      // Render character video onto canvas
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvasW, canvasH);

      let squashX = 1;
      let squashY = 1;
      if (state.flipTimer > 0) {
        const s = Math.sin((state.flipTimer / 0.2) * Math.PI);
        squashX = 1 - 0.26 * s;
        squashY = 1 + 0.05 * s;
      }

      ctx.save();
      ctx.translate(canvasW * 0.5, canvasH * 0.965);
      ctx.rotate((state.lean * Math.PI) / 180);
      ctx.scale(squashX, squashY);
      if (mirrorVideo) ctx.scale(-1, 1);

      // Push studio background [246..248] cleanly to pure 255 white so multiply blend has zero rectangle seam
      ctx.filter = 'brightness(1.048) contrast(1.022)';
      drawVideoCenterCrop(
        ctx,
        activeVideo,
        -charW * 0.5,
        -canvasH * 0.965,
        charW,
        canvasH,
        640 / 1080
      );
      ctx.restore();

      // Soft horizontal feather at outer left/right edges of crop
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      const grad = ctx.createLinearGradient(0, 0, canvasW, 0);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.14, 'rgba(0,0,0,1)');
      grad.addColorStop(0.86, 'rgba(0,0,0,1)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvasW, canvasH);
      ctx.restore();

      // 0.14s state-change crossfade from previous snapshot
      if (state.fadeTimer > 0 && state.hasSnap) {
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = state.fadeTimer / 0.14;
        ctx.drawImage(snapCanvas, 0, 0);
        ctx.restore();
      }

      ctx.restore();

      // Position stage + contact shadow via GPU transform
      stageEl.style.transform = `translate3d(${state.x - canvasW * 0.5}px, 0, 0)`;
      if (shadowEl) {
        const shadowScale = 1 - Math.min(0.18, Math.abs(state.vel) / 2600);
        shadowEl.style.transform = `translate3d(${state.x}px, 0, 0) translateX(-50%) scaleX(${shadowScale})`;
      }

      // Position speech bubble beside head & keep strictly inside screen
      const shouldFlipBubble = state.x > heroW * 0.62;
      setBubbleFlipLeft((prev) => (prev !== shouldFlipBubble ? shouldFlipBubble : prev));
      if (bubbleEl) {
        const bubbleW = bubbleEl.offsetWidth || 180;
        const headOffset = charW * 0.28;
        let bx = shouldFlipBubble
          ? state.x - headOffset - bubbleW
          : state.x + headOffset;
        bx = Math.max(16, Math.min(heroW - bubbleW - 16, bx));
        const by = -canvasH * 0.86;
        bubbleEl.style.left = `${bx}px`;
        bubbleEl.style.top = `${by}px`;
      }

      // Opposite shift on giant background letters
      if (giantWrapRef.current && !reduced) {
        const norm = (state.x - heroW * 0.5) / Math.max(1, heroW * 0.5);
        giantWrapRef.current.style.transform = `translate3d(${-norm * 26}px, 0, 0)`;
      }

      // Side notes fade to .08 when character comes near
      const updateNoteFade = (el, side) => {
        if (!el) return;
        const noteX = side === 'left' ? heroW * 0.14 : heroW * 0.86;
        const d = Math.abs(state.x - noteX);
        const near = Math.max(0, Math.min(1, (d - 110) / 150));
        const op = 0.08 + near * 0.92;
        el.style.opacity = op.toFixed(3);
      };
      updateNoteFade(leftNoteRef.current, 'left');
      updateNoteFade(rightNoteRef.current, 'right');

      // Render dust puffs on floor strip canvas
      dustCtx.save();
      dustCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dustCtx.clearRect(0, 0, heroW, 100);
      for (let i = state.dust.length - 1; i >= 0; i--) {
        const p = state.dust[i];
        p.age += dt;
        if (p.age >= p.life) {
          state.dust.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vx *= 0.94;
        const t = p.age / p.life;
        const rad = p.r + t * 9;
        const alpha = (1 - t) * 0.28;
        dustCtx.fillStyle = `rgba(128, 124, 118, ${alpha.toFixed(3)})`;
        dustCtx.beginPath();
        dustCtx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        dustCtx.fill();
      }
      dustCtx.restore();
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      pauseAllHeroVideos();
      io.disconnect();
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('touchstart', onTouch);
      section.removeEventListener('touchmove', onTouch);
      window.removeEventListener('resize', updateLayout);
    };
  }, []);

  const letters = DATA.firstName.toUpperCase().split('');

  return (
    <section id="hero" ref={sectionRef} className="hero-section">
      {/* Two slow drifting blurred blobs */}
      <div className="hero-blobs" aria-hidden="true">
        <div className="hero-blob blob-one" />
        <div className="hero-blob blob-two" />
      </div>

      {/* Absolute Nav at top of hero only */}
      <Navbar onNavigate={onNavigate} />

      {/* Giant background first name */}
      <div className="hero-giant-outer" aria-hidden="true">
        <div ref={giantWrapRef} className="hero-giant-parallax">
          <div ref={giantInnerRef} className="hero-giant-name">
            {letters.map((ch, idx) => (
              <span
                key={idx}
                className={`hero-giant-letter ${ch === ' ' ? 'is-space' : ''}`}
              >
                {ch === ' ' ? '\u00A0' : ch}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Side notes at 46% height */}
      <div ref={leftNoteRef} className="hero-side-note is-left">
        <span className="hero-note-mono">{DATA.heroSideNotes.left.mono}</span>
        <span className="hero-note-main">{DATA.heroSideNotes.left.main}</span>
        <em className="hero-note-italic">{DATA.heroSideNotes.left.italic}</em>
      </div>

      <div ref={rightNoteRef} className="hero-side-note is-right">
        <span className="hero-note-mono">{DATA.heroSideNotes.right.mono}</span>
        <span className="hero-note-main">{DATA.heroSideNotes.right.main}</span>
        <em className="hero-note-italic">{DATA.heroSideNotes.right.italic}</em>
      </div>

      {/* Floor plane + dust + contact shadow + character canvas + speech bubble */}
      <div className="hero-floor-anchor">
        <canvas ref={dustCanvasRef} className="hero-dust-canvas" aria-hidden="true" />
        <div ref={shadowRef} className="hero-contact-shadow" aria-hidden="true" />
        <div ref={floorLineRef} className="hero-floor-line" aria-hidden="true" />

        <div ref={charStageRef} className="hero-char-stage">
          <canvas
            ref={charCanvasRef}
            className="hero-char-canvas"
            aria-label={`${DATA.firstName} interactive 3D character`}
          />
        </div>

        <div
          ref={bubbleRef}
          className={`hero-speech-bubble ${bubbleVisible ? 'is-visible' : ''} ${
            bubbleFlipLeft ? 'is-left' : 'is-right'
          }`}
          aria-live="polite"
        >
          <span>{bubbleText}</span>
        </div>
      </div>

      {/* Below floor line: Name, 1-sentence summary, 2 CTA pills */}
      <div ref={bottomContentRef} className="hero-bottom-bar">
        <div className="hero-identity">
          <h1 className="hero-fullname">
            <span className="hero-fn-anton">{DATA.firstName}</span>{' '}
            <em className="hero-ln-serif">{DATA.lastName}</em>
          </h1>
          <p className="hero-summary-line">{DATA.heroSummary}</p>
        </div>

        <div className="hero-cta-group">
          <a
            href="#work"
            className="pill-btn is-charcoal"
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.('#work');
            }}
          >
            See my work
          </a>
          <a
            href="#contact"
            className="pill-btn is-outline-dark"
            onClick={(e) => {
              e.preventDefault();
              onNavigate?.('#contact');
            }}
          >
            Get in touch
          </a>
        </div>
      </div>
    </section>
  );
}
