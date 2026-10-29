import { useEffect, useMemo, useRef, useState } from 'react';

function HeatmapVisual({ active }) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [phase, setPhase] = useState(0);

  // 7x6 grid of monochrome route & check-in intensity values
  const baseValues = useMemo(
    () =>
      Array.from({ length: 42 }, (_, i) => {
        const r = Math.floor(i / 7);
        const c = i % 7;
        const dist = Math.hypot(r - 2.5, c - 3);
        return Math.round(38 + Math.max(0, 62 - dist * 16) + ((i * 17) % 19));
      }),
    []
  );

  useEffect(() => {
    if (!active) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % 100);
    }, 520);
    return () => clearInterval(id);
  }, [active]);

  const activeVal =
    hoveredCell !== null
      ? Math.min(99, baseValues[hoveredCell] + ((phase * 3 + hoveredCell) % 9))
      : 84 + (phase % 7);

  return (
    <div className="wv-heatmap">
      <div className="wv-top-row">
        <span className="wv-mono-tag">LIVE ROUTE DENSITY</span>
        <span className="wv-readout">
          {hoveredCell !== null ? `CELL #${String(hoveredCell + 1).padStart(2, '0')} · ` : 'PEAK · '}
          <strong>{activeVal}</strong> check-ins/hr
        </span>
      </div>

      <div className="wv-grid" onMouseLeave={() => setHoveredCell(null)}>
        {baseValues.map((v, idx) => {
          const wave = Math.sin(phase * 0.45 + idx * 0.42) * 14;
          const intensity = Math.max(12, Math.min(98, Math.round(v + wave)));
          const alpha = (0.1 + (intensity / 100) * 0.78).toFixed(2);
          const isHov = hoveredCell === idx;

          return (
            <button
              key={idx}
              type="button"
              className={`wv-cell ${isHov ? 'is-hovered' : ''}`}
              style={{
                backgroundColor: `rgba(239, 235, 228, ${alpha})`,
              }}
              onMouseEnter={() => setHoveredCell(idx)}
              onFocus={() => setHoveredCell(idx)}
              aria-label={`Sector ${idx + 1}: ${intensity} check-ins per hour`}
            >
              <span className="wv-cell-tip">{intensity}</span>
            </button>
          );
        })}
      </div>

      <div className="wv-legend">
        <span>LOW TRAFFIC</span>
        <div className="wv-legend-ramp" aria-hidden="true">
          <i style={{ opacity: 0.18 }} />
          <i style={{ opacity: 0.36 }} />
          <i style={{ opacity: 0.56 }} />
          <i style={{ opacity: 0.78 }} />
          <i style={{ opacity: 0.95 }} />
        </div>
        <span>HIGH DEMAND</span>
      </div>
    </div>
  );
}

function OrbitVisual({ meta }) {
  const core = meta?.core || 'POSTGIS';
  const rings = meta?.rings || [
    ['Flask', 'WMS/WFS'],
    ['GeoServer', 'Cesium 3D', 'GDAL'],
    ['PDAL', 'ogr2ogr', 'LAS 3D'],
  ];

  return (
    <div className="wv-orbit">
      <div className="wv-top-row">
        <span className="wv-mono-tag">SPATIAL PIPELINE TOPOLOGY</span>
        <span className="wv-readout">3 ACTIVE LAYERS</span>
      </div>

      <div className="wv-orbit-stage">
        {rings.map((pills, rIdx) => {
          const sizePct = 44 + rIdx * 23; // 44%, 67%, 90%
          const reverse = rIdx % 2 === 1;
          const dur = 18 + rIdx * 7;

          return (
            <div
              key={rIdx}
              className={`wv-orbit-ring ${reverse ? 'is-reverse' : ''}`}
              style={{
                width: `${sizePct}%`,
                height: `${sizePct}%`,
                animationDuration: `${dur}s`,
              }}
            >
              {pills.map((label, pIdx) => {
                const angle = (pIdx / pills.length) * 360;
                return (
                  <div
                    key={label}
                    className="wv-orbit-spoke"
                    style={{ transform: `rotate(${angle}deg)` }}
                  >
                    <span
                      className={`wv-orbit-pill ${reverse ? 'is-counter-rev' : 'is-counter'}`}
                      style={{ animationDuration: `${dur}s` }}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}

        <div className="wv-orbit-core">
          <span>{core}</span>
        </div>
      </div>
    </div>
  );
}

function ScannerVisual() {
  const lines = [
    { w: '78%', risky: false },
    { w: '92%', risky: true, tag: 'RISK' },
    { w: '64%', risky: false },
    { w: '86%', risky: false },
    { w: '88%', risky: true, tag: 'CLAUSE' },
    { w: '56%', risky: false },
    { w: '74%', risky: false },
  ];

  return (
    <div className="wv-scanner">
      <div className="wv-top-row">
        <span className="wv-mono-tag">AUTOMATED AUDIT</span>
        <span className="wv-readout">SCORE 94 / 100</span>
      </div>

      <div className="wv-scanner-body">
        <div className="wv-doc">
          <div className="wv-scan-beam" aria-hidden="true" />
          {lines.map((ln, idx) => (
            <div
              key={idx}
              className={`wv-doc-line ${ln.risky ? 'is-risky' : ''}`}
              style={{ width: ln.w }}
            >
              {ln.risky && <span className="wv-risk-badge">{ln.tag}</span>}
            </div>
          ))}
        </div>

        <div className="wv-score-box">
          <span className="wv-score-big">94</span>
          <span className="wv-score-sub">SAFETY INDEX</span>
        </div>
      </div>
    </div>
  );
}

export default function WorkVisual({ project, active }) {
  if (project.visual === 'orbit') {
    return <OrbitVisual meta={project.visualMeta} active={active} />;
  }
  if (project.visual === 'scanner') {
    return <ScannerVisual active={active} />;
  }
  return <HeatmapVisual meta={project.visualMeta} active={active} />;
}

