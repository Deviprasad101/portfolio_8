import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import SectionHeader from './SectionHeader';

gsap.registerPlugin(ScrollTrigger);

const PILE_ANGLES = [-11, 8.5, -6.5, 12.5, -9, 7, -12, 9.5];
const PILE_OFFSETS = [
  { x: -12, y: 8 },
  { x: 14, y: -10 },
  { x: -8, y: -12 },
  { x: 10, y: 11 },
];

export default function Certifications() {
  const sectionRef = useRef(null);
  const gridRef = useRef(null);
  const countBgRef = useRef(null);
  const cardRefs = useRef([]);

  const certs = DATA.certifications;

  useEffect(() => {
    const section = sectionRef.current;
    const grid = gridRef.current;
    const countBg = countBgRef.current;
    if (!section || !grid) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean);

      const getPileDelta = (index, axis) => {
        const el = cards[index];
        if (!el || !grid) return 0;
        gsap.set(el, { clearProps: 'transform' });
        const gRect = grid.getBoundingClientRect();
        const cRect = el.getBoundingClientRect();
        const gCx = gRect.left + gRect.width * 0.5;
        const gCy = gRect.top + gRect.height * 0.5;
        const cCx = cRect.left + cRect.width * 0.5;
        const cCy = cRect.top + cRect.height * 0.5;
        const jitter = PILE_OFFSETS[index % PILE_OFFSETS.length];
        return axis === 'x' ? gCx - cCx + jitter.x : gCy - cCy + jitter.y;
      };

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });

      if (countBg) {
        tl.fromTo(
          countBg,
          { opacity: 0.14, scale: 0.94 },
          { opacity: 0, scale: 1.18, duration: 0.72, ease: 'power2.out' },
          0
        );
      }

      cards.forEach((card, i) => {
        tl.fromTo(
          card,
          {
            x: () => getPileDelta(i, 'x'),
            y: () => getPileDelta(i, 'y'),
            rotation: PILE_ANGLES[i % PILE_ANGLES.length],
            scale: 0.62,
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            duration: 1,
            ease: 'expo.out',
          },
          i * 0.03
        );
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const totalCount = String(certs.length).padStart(2, '0');

  return (
    <section id="certifications" ref={sectionRef} className="certs-section">
      <div className="container certs-inner">
        <SectionHeader
          label="07 — Certifications"
          titleLead="Paper"
          titleAccent="trail"
          theme="light"
        />

        <div className="certs-stage">
          <div ref={countBgRef} className="certs-faint-count" aria-hidden="true">
            {totalCount}
          </div>

          <div ref={gridRef} className="certs-grid">
            {certs.map((cert, idx) => (
              <article
                key={cert.number}
                ref={(el) => {
                  cardRefs.current[idx] = el;
                }}
                className={`cert-card look-${cert.look}`}
              >
                <div className="cert-card-top">
                  <span className="cert-category-tag">{cert.category}</span>
                  <span className="cert-number">{cert.number}</span>
                </div>

                <div className="cert-monogram" aria-hidden="true">
                  {cert.monogram}
                </div>

                <div className="cert-card-bottom">
                  <h3 className="cert-name">{cert.name}</h3>
                  <div className="cert-issuer">{cert.issuer}</div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

