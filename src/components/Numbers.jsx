import { useEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DATA } from '../data';
import SectionHeader from './SectionHeader';

gsap.registerPlugin(ScrollTrigger);

export default function Numbers() {
  const sectionRef = useRef(null);
  const paraRef = useRef(null);
  const litRefs = useRef([]);
  const chipRefs = useRef([]);

  // Flatten tokens into scrubbable items (individual words + numeric chips)
  const items = useMemo(() => {
    const out = [];
    DATA.numbersTokens.forEach((tok) => {
      if (tok.type === 'text') {
        tok.text.split(/\s+/).forEach((word) => {
          if (word) out.push({ type: 'word', word });
        });
      } else {
        out.push({ type: 'chip', ...tok });
      }
    });
    return out;
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    const para = paraRef.current;
    if (!section || !para) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const poppedState = new Array(items.length).fill(false);

    if (reduced) {
      litRefs.current.forEach((el) => {
        if (el) el.style.opacity = '1';
      });
      chipRefs.current.forEach((entry, idx) => {
        if (!entry?.pill || !entry?.valEl) return;
        const item = items[idx];
        entry.pill.style.opacity = '1';
        entry.pill.style.transform = 'scale(1)';
        entry.valEl.textContent = `${item.value.toFixed(item.decimals)}${item.suffix}`;
      });
      return;
    }

    const st = ScrollTrigger.create({
      trigger: para,
      start: 'top 86%',
      end: 'bottom 62%',
      scrub: true,
      onUpdate: (self) => {
        const p = self.progress;
        const total = items.length;

        for (let i = 0; i < total; i++) {
          const item = items[i];
          const start = (i / total) * 0.86;
          const local = Math.max(0, Math.min(1, (p - start) / 0.14));

          if (item.type === 'word') {
            const lit = litRefs.current[i];
            if (lit) {
              lit.style.opacity = local.toFixed(3);
            }
          } else if (item.type === 'chip') {
            const entry = chipRefs.current[i];
            if (!entry?.pill || !entry?.valEl) continue;

            if (local > 0.2 && !poppedState[i]) {
              poppedState[i] = true;
              gsap.killTweensOf(entry.pill);
              gsap.killTweensOf(entry.counter);
              gsap.fromTo(
                entry.pill,
                { scale: 0.72, opacity: 0.25, y: 10 },
                { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: 'back.out(1.7)' }
              );
              entry.counter.val = 0;
              gsap.to(entry.counter, {
                val: item.value,
                duration: 1.05,
                ease: 'power3.out',
                onUpdate: () => {
                  if (entry.valEl) {
                    entry.valEl.textContent = `${entry.counter.val.toFixed(item.decimals)}${
                      item.suffix
                    }`;
                  }
                },
              });
            } else if (local <= 0.02 && poppedState[i]) {
              poppedState[i] = false;
              gsap.killTweensOf(entry.pill);
              gsap.killTweensOf(entry.counter);
              gsap.set(entry.pill, { scale: 0.86, opacity: 0.32, y: 4 });
              entry.valEl.textContent = `${(0).toFixed(item.decimals)}${item.suffix}`;
            }
          }
        }
      },
    });

    return () => st.kill();
  }, [items]);

  return (
    <section id="numbers" ref={sectionRef} className="numbers-section">
      <div className="container">
        <SectionHeader
          label="03 — In numbers"
          theme="dark"
          rightNote="One sentence, read it slowly"
        />

        <p ref={paraRef} className="numbers-paragraph">
          {items.map((item, idx) => {
            if (item.type === 'word') {
              return (
                <span key={idx} className="num-word">
                  <span className="num-word-dim">{item.word}</span>
                  <span
                    ref={(el) => {
                      litRefs.current[idx] = el;
                    }}
                    className="num-word-lit"
                    aria-hidden="true"
                  >
                    {item.word}
                  </span>{' '}
                </span>
              );
            }

            return (
              <span key={idx} className="num-chip-outer">
                <span
                  ref={(el) => {
                    if (!chipRefs.current[idx]) {
                      chipRefs.current[idx] = { pill: null, valEl: null, counter: { val: 0 } };
                    }
                    chipRefs.current[idx].pill = el;
                  }}
                  className="num-chip"
                >
                  <span
                    ref={(el) => {
                      if (!chipRefs.current[idx]) {
                        chipRefs.current[idx] = { pill: null, valEl: null, counter: { val: 0 } };
                      }
                      chipRefs.current[idx].valEl = el;
                    }}
                    className="num-chip-value"
                  >
                    {(0).toFixed(item.decimals)}
                    {item.suffix}
                  </span>
                  <span className="num-chip-label">{item.label}</span>
                </span>{' '}
              </span>
            );
          })}
        </p>
      </div>
    </section>
  );
}
