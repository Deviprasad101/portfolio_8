import characterPosterSrc from '../../character.png?url';
import waveSrc from '../../wave.mp4.mp4?url';
import runRightSrc from '../../run_right.mp4.mp4?url';
import runLeftSrc from '../../run_left.mp4.mp4?url';
import turn360Src from '../../turn_360.mp4.mp4?url';

export const BG = '#f5f3ef';

// Measured timing landmarks (in seconds) across the 4 videos
export const VIDEO_TIMING = {
  wave: {
    firstWaveEnd: 3.9,
  },
  runRight: {
    startFrom: 0.9,
    startTo: 2.15,
    loopFrom: 4.2,
    loopTo: 8.8,
  },
  runLeft: {
    startFrom: 0.92,
    startTo: 2.2,
    loopFrom: 4.2,
    loopTo: 8.85,
  },
  turn: {
    // Front -> Left profile in turn_360 (frames ~78..134 @ 30fps)
    leftFront: 2.6,
    leftProfile: 4.46,
    // Front -> Right profile (frames ~294..241 @ 30fps, mirrored horizontally so nose turns right)
    rightFront: 9.76,
    rightProfile: 8.03,
    // Full 360 scrub range for About section
    aboutStart: 2.45,
    aboutEnd: 9.78,
  },
};

const SOURCES = {
  wave: waveSrc,
  runRight: runRightSrc,
  runLeft: runLeftSrc,
  turn360: turn360Src,
};

const blobUrls = {};
const videos = {
  heroWave: null,
  heroRunRight: null,
  heroRunLeft: null,
  heroTurn: null,
  aboutTurn: null,
  contactWave: null,
  posterImg: null,
};

let loadPromise = null;

function createVideoElement(src, loop = false) {
  const v = document.createElement('video');
  v.src = src;
  v.muted = true;
  v.defaultMuted = true;
  v.playsInline = true;
  v.setAttribute('playsinline', '');
  v.setAttribute('webkit-playsinline', '');
  v.preload = 'auto';
  v.loop = loop;
  v.crossOrigin = 'anonymous';
  return v;
}

function waitVideoReady(v) {
  return new Promise((resolve) => {
    if (v.readyState >= 1 && v.videoWidth > 0) {
      resolve(v);
      return;
    }
    let settled = false;
    const onDone = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      v.removeEventListener('loadeddata', onDone);
      v.removeEventListener('loadedmetadata', onDone);
      v.removeEventListener('error', onDone);
      resolve(v);
    };
    const timer = setTimeout(onDone, 2500);
    v.addEventListener('loadeddata', onDone);
    v.addEventListener('loadedmetadata', onDone);
    v.addEventListener('error', onDone);
    v.load();
  });
}

async function fetchBlobWithProgress(url, onBytes) {
  const res = await fetch(url);
  if (!res.body || !res.ok) {
    const blob = await res.blob();
    onBytes(blob.size, blob.size);
    return URL.createObjectURL(blob);
  }
  const total = Number(res.headers.get('content-length')) || 0;
  const reader = res.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.byteLength;
    onBytes(loaded, total || loaded);
  }
  const blob = new Blob(chunks, { type: 'video/mp4' });
  return URL.createObjectURL(blob);
}

export function preloadAllVideos(onProgress) {
  if (loadPromise) return loadPromise;

  const keys = Object.keys(SOURCES);
  const progressMap = {};
  keys.forEach((k) => {
    progressMap[k] = 0;
  });

  const emitProgress = () => {
    const sum = keys.reduce((acc, k) => acc + progressMap[k], 0);
    onProgress?.(Math.min(0.95, (sum / keys.length) * 0.95));
  };

  loadPromise = (async () => {
    await Promise.all(
      keys.map(async (key) => {
        try {
          const objUrl = await fetchBlobWithProgress(SOURCES[key], (loaded, total) => {
            progressMap[key] = total > 0 ? Math.min(1, loaded / total) : 0.8;
            emitProgress();
          });
          blobUrls[key] = objUrl;
          progressMap[key] = 1;
          emitProgress();
        } catch {
          blobUrls[key] = SOURCES[key];
          progressMap[key] = 1;
          emitProgress();
        }
      })
    );

    const posterPromise = new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = characterPosterSrc;
    });

    videos.heroWave = createVideoElement(blobUrls.wave, false);
    videos.heroRunRight = createVideoElement(blobUrls.runRight, false);
    videos.heroRunLeft = createVideoElement(blobUrls.runLeft, false);
    videos.heroTurn = createVideoElement(blobUrls.turn360, false);
    videos.aboutTurn = createVideoElement(blobUrls.turn360, false);
    videos.contactWave = createVideoElement(blobUrls.wave, true);

    const [poster] = await Promise.all([
      posterPromise,
      waitVideoReady(videos.heroWave),
      waitVideoReady(videos.heroRunRight),
      waitVideoReady(videos.heroRunLeft),
      waitVideoReady(videos.heroTurn),
      waitVideoReady(videos.aboutTurn),
      waitVideoReady(videos.contactWave),
    ]);
    videos.posterImg = poster;

    // Prime initial timestamps so frame 0 is decoded and ready
    videos.heroWave.currentTime = 0.02;
    videos.heroRunRight.currentTime = VIDEO_TIMING.runRight.startFrom;
    videos.heroRunLeft.currentTime = VIDEO_TIMING.runLeft.startFrom;
    videos.heroTurn.currentTime = VIDEO_TIMING.turn.leftFront;
    videos.aboutTurn.currentTime = VIDEO_TIMING.turn.aboutStart;
    videos.contactWave.currentTime = 0.02;

    onProgress?.(1);
    return videos;
  })();

  return loadPromise;
}

export function getVideos() {
  return videos;
}

export function seekSmooth(video, timeSec) {
  if (!video || !Number.isFinite(timeSec)) return;
  const dur = video.duration || 10;
  const clamped = Math.max(0, Math.min(dur - 0.03, timeSec));
  if (!video.seeking && Math.abs(video.currentTime - clamped) > 0.018) {
    try {
      video.currentTime = clamped;
    } catch {
      // ignore transient InvalidStateError before metadata
    }
  }
}

/**
 * Draw a center-cropped slice of `video` matching `aspect` (default 640/1080)
 * regardless of whether the source video is 1920x1080 or 1280x720.
 */
export function drawVideoCenterCrop(ctx, video, dx, dy, dw, dh, aspect = 640 / 1080) {
  if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) {
    return false;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  const cropW = Math.min(vw, vh * aspect);
  const sx = (vw - cropW) * 0.5;
  ctx.drawImage(video, sx, 0, cropW, vh, dx, dy, dw, dh);
  return true;
}

export function drawImageCenterCrop(ctx, img, dx, dy, dw, dh, aspect = 800 / 1080) {
  if (!img || !img.complete || !img.naturalWidth || !img.naturalHeight) {
    return false;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const cropW = Math.min(iw, ih * aspect);
  const sx = (iw - cropW) * 0.5;
  ctx.drawImage(img, sx, 0, cropW, ih, dx, dy, dw, dh);
  return true;
}

// Reusable offscreen buffers for real-time Contact dark-background cutout
const MASK_W = 168;
const MASK_H = 284;
let workCanvas = null;
let workCtx = null;
let hiCanvas = null;
let hiCtx = null;
let visitedBuf = null;
let canBgBuf = null;
let queueBuf = null;
let protectedBuf = null;

function ensureCutoutBuffers(outW, outH) {
  if (!workCanvas) {
    workCanvas = document.createElement('canvas');
    workCanvas.width = MASK_W;
    workCanvas.height = MASK_H;
    workCtx = workCanvas.getContext('2d', { willReadFrequently: true });

    visitedBuf = new Uint8Array(MASK_W * MASK_H);
    canBgBuf = new Uint8Array(MASK_W * MASK_H);
    queueBuf = new Int32Array(MASK_W * MASK_H);
    protectedBuf = new Uint8Array(MASK_W * MASK_H);

    // Precompute stationary white shirt (chest + shoulders + right sleeve) & white sneaker core protection mask
    for (let y = 0; y < MASK_H; y++) {
      const yn = y / MASK_H;
      for (let x = 0; x < MASK_W; x++) {
        const xn = x / MASK_W;
        // Chest & shoulders trapezoid + ellipse
        const inShoulders =
          yn >= 0.195 &&
          yn <= 0.425 &&
          xn >= 0.34 - (yn - 0.2) * 0.12 &&
          xn <= 0.665 + (yn - 0.2) * 0.16;
        const inRightArm =
          (((xn - 0.675) / 0.062) ** 2 + ((yn - 0.34) / 0.105) ** 2) < 1;
        const inLeftShoe =
          (((xn - 0.398) / 0.068) ** 2 + ((yn - 0.945) / 0.032) ** 2) < 1;
        const inRightShoe =
          (((xn - 0.585) / 0.068) ** 2 + ((yn - 0.945) / 0.032) ** 2) < 1;

        if (inShoulders || inRightArm || inLeftShoe || inRightShoe) {
          protectedBuf[y * MASK_W + x] = 1;
        }
      }
    }
  }

  if (!hiCanvas || hiCanvas.width !== outW || hiCanvas.height !== outH) {
    hiCanvas = document.createElement('canvas');
    hiCanvas.width = outW;
    hiCanvas.height = outH;
    hiCtx = hiCanvas.getContext('2d', { willReadFrequently: true });
  }
}

/**
 * Real-time border-connected flood-fill + edge unmix for wave.mp4 over dark Contact background.
 */
export function drawWaveCutoutOnDark(ctx, video, cw, ch, dpr) {
  if (!video || video.readyState < 2 || !video.videoWidth) return;

  const outW = Math.max(1, Math.round(cw * dpr));
  const outH = Math.max(1, Math.round(ch * dpr));
  ensureCutoutBuffers(outW, outH);

  // 1. Sample low-res crop for flood-fill alpha mask
  workCtx.clearRect(0, 0, MASK_W, MASK_H);
  drawVideoCenterCrop(workCtx, video, 0, 0, MASK_W, MASK_H, 640 / 1080);
  const lowImg = workCtx.getImageData(0, 0, MASK_W, MASK_H);
  const d = lowImg.data;

  // Estimate studio corner background from top-left & top-right 8x8 patches
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let cnt = 0;
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const i1 = (y * MASK_W + x) * 4;
      const i2 = (y * MASK_W + (MASK_W - 1 - x)) * 4;
      rSum += d[i1] + d[i2];
      gSum += d[i1 + 1] + d[i2 + 1];
      bSum += d[i1 + 2] + d[i2 + 2];
      cnt += 2;
    }
  }
  const bgR = rSum / cnt;
  const bgG = gSum / cnt;
  const bgB = bSum / cnt;
  const bgRB = bgR - bgB;

  visitedBuf.fill(0);
  canBgBuf.fill(0);

  for (let y = 0; y < MASK_H; y++) {
    const rowOff = y * MASK_W;
    for (let x = 0; x < MASK_W; x++) {
      const idx = rowOff + x;
      if (protectedBuf[idx]) continue;

      const p = idx * 4;
      const r = d[p];
      const g = d[p + 1];
      const b = d[p + 2];

      const maxDiff = Math.max(Math.abs(r - bgR), Math.abs(g - bgG), Math.abs(b - bgB));
      if (maxDiff > 14.5) continue;

      const chroma = Math.abs(r - b - bgRB);
      if (chroma > 7.5) continue;

      // Local gradient barrier
      let grad = 0;
      if (x > 0) {
        const pl = p - 4;
        grad = Math.max(
          grad,
          Math.abs(r - d[pl]),
          Math.abs(g - d[pl + 1]),
          Math.abs(b - d[pl + 2])
        );
      }
      if (y > 0) {
        const pu = p - MASK_W * 4;
        grad = Math.max(
          grad,
          Math.abs(r - d[pu]),
          Math.abs(g - d[pu + 1]),
          Math.abs(b - d[pu + 2])
        );
      }
      if (grad < 7.0) {
        canBgBuf[idx] = 1;
      }
    }
  }

  // Seed flood-fill from borders + gap between trousers
  let head = 0;
  let tail = 0;
  const push = (idx) => {
    if (canBgBuf[idx] && !visitedBuf[idx]) {
      visitedBuf[idx] = 1;
      queueBuf[tail++] = idx;
    }
  };

  for (let x = 0; x < MASK_W; x++) {
    push(x);
    push((MASK_H - 1) * MASK_W + x);
  }
  for (let y = 0; y < MASK_H; y++) {
    push(y * MASK_W);
    push(y * MASK_W + (MASK_W - 1));
  }
  const midX = Math.floor(MASK_W * 0.49);
  for (let y = Math.floor(MASK_H * 0.55); y < Math.floor(MASK_H * 0.91); y += 2) {
    for (let dx = -3; dx <= 3; dx++) {
      push(y * MASK_W + midX + dx);
    }
  }

  while (head < tail) {
    const curr = queueBuf[head++];
    const x = curr % MASK_W;
    const y = (curr - x) / MASK_W;
    if (y > 0) push(curr - MASK_W);
    if (y < MASK_H - 1) push(curr + MASK_W);
    if (x > 0) push(curr - 1);
    if (x < MASK_W - 1) push(curr + 1);
  }

  // Write soft 3x3 box-feathered foreground alpha into lowImg alpha channel
  for (let y = 0; y < MASK_H; y++) {
    for (let x = 0; x < MASK_W; x++) {
      let fgCount = 0;
      let samples = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const ny = y + ky;
        if (ny < 0 || ny >= MASK_H) continue;
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx;
          if (nx < 0 || nx >= MASK_W) continue;
          samples++;
          if (!visitedBuf[ny * MASK_W + nx]) fgCount++;
        }
      }
      const ratio = fgCount / samples;
      // Slightly tighten outer fringe
      const tightened = Math.max(0, Math.min(1, (ratio - 0.22) / 0.72));
      const p = (y * MASK_W + x) * 4;
      d[p] = 255;
      d[p + 1] = 255;
      d[p + 2] = 255;
      d[p + 3] = Math.round(tightened * 255);
    }
  }
  workCtx.putImageData(lowImg, 0, 0);

  // 2. Composite full-res frame masked by upscaled smooth alpha
  hiCtx.save();
  hiCtx.clearRect(0, 0, outW, outH);
  drawVideoCenterCrop(hiCtx, video, 0, 0, outW, outH, 640 / 1080);

  // Unmix studio halo slightly along semi-transparent edges via destination-in mask
  hiCtx.globalCompositeOperation = 'destination-in';
  hiCtx.filter = 'blur(1.2px)';
  hiCtx.drawImage(workCanvas, 0, 0, outW, outH);
  hiCtx.restore();

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(hiCanvas, 0, 0);
  ctx.restore();
}

