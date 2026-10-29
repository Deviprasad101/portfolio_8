import { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';
import { DATA } from '../data';
import SectionHeader from './SectionHeader';

export default function Skills() {
  const sectionRef = useRef(null);
  const pitRef = useRef(null);
  const pillElsRef = useRef([]);
  const bodiesRef = useRef([]);
  const engineRef = useRef(null);

  const [activeGroup, setActiveGroup] = useState(null);

  useEffect(() => {
    const pit = pitRef.current;
    if (!pit) return;

    const { Engine, World, Bodies, Body, Mouse, MouseConstraint, Events } = Matter;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const engine = Engine.create({
      gravity: { x: 0, y: 1.1, scale: 0.001 },
    });
    engineRef.current = engine;

    let pitW = pit.clientWidth || 1100;
    let pitH = pit.clientHeight || 460;
    const wallThick = 120;

    let ground = null;
    let leftWall = null;
    let rightWall = null;
    let ceiling = null;

    const buildWalls = () => {
      if (ground) {
        World.remove(engine.world, [ground, leftWall, rightWall, ceiling]);
      }
      pitW = pit.clientWidth || 1100;
      pitH = pit.clientHeight || 460;

      const opts = { isStatic: true, restitution: 0.45, friction: 0.2 };
      ground = Bodies.rectangle(
        pitW / 2,
        pitH + wallThick / 2 - 4,
        pitW + wallThick * 2,
        wallThick,
        opts
      );
      leftWall = Bodies.rectangle(
        -wallThick / 2 + 4,
        pitH / 2 - 200,
        wallThick,
        pitH + 800,
        opts
      );
      rightWall = Bodies.rectangle(
        pitW + wallThick / 2 - 4,
        pitH / 2 - 200,
        wallThick,
        pitH + 800,
        opts
      );
      ceiling = Bodies.rectangle(
        pitW / 2,
        -520,
        pitW + wallThick * 2,
        wallThick,
        opts
      );
      World.add(engine.world, [ground, leftWall, rightWall, ceiling]);
    };

    buildWalls();

    let spawned = false;
    const spawnPills = () => {
      if (spawned) return;
      spawned = true;
      pitW = pit.clientWidth || 1100;
      pitH = pit.clientHeight || 460;

      const created = DATA.skills.map((skill, idx) => {
        const el = pillElsRef.current[idx];
        const w = el?.offsetWidth || 128;
        const h = el?.offsetHeight || 48;

        const cols = Math.max(3, Math.floor((pitW - 60) / 145));
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const startX =
          ((col + 0.5) / cols) * (pitW - 90) + 45 + ((idx * 19) % 24) - 12;
        const startY = reduced
          ? pitH - 36 - row * (h + 10)
          : -40 - row * 68 - (idx % 3) * 22;

        const body = Bodies.rectangle(startX, startY, w, h, {
          chamfer: { radius: Math.max(12, h * 0.48) },
          restitution: 0.45,
          friction: 0.16,
          frictionAir: 0.012,
          angle: reduced ? 0 : ((idx % 5) - 2) * 0.06,
        });
        body._w = w;
        body._h = h;
        body._group = skill.group;
        return body;
      });

      bodiesRef.current = created;
      World.add(engine.world, created);
    };

    // Mouse constraint without blocking page scroll
    const mouse = Mouse.create(pit);
    mouse.pixelRatio = 1;
    // Strip Matter's wheel capture so Lenis / native page scrolling never blocks
    if (mouse.mousewheel) {
      mouse.element.removeEventListener('mousewheel', mouse.mousewheel);
      mouse.element.removeEventListener('DOMMouseScroll', mouse.mousewheel);
      mouse.element.removeEventListener('wheel', mouse.mousewheel);
    }

    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.22,
        damping: 0.08,
        render: { visible: false },
      },
    });
    World.add(engine.world, mc);

    // Release grab if pointer leaves pit so pills never stick to cursor
    const onPointerLeave = () => {
      mc.mouse.button = -1;
    };
    pit.addEventListener('pointerleave', onPointerLeave);
    window.addEventListener('pointerup', onPointerLeave);

    // Clamp excessive throw velocities so bodies stay inside the pit
    Events.on(engine, 'beforeUpdate', () => {
      for (const b of bodiesRef.current) {
        const maxV = 28;
        if (Math.abs(b.velocity.x) > maxV || Math.abs(b.velocity.y) > maxV) {
          Body.setVelocity(b, {
            x: Math.max(-maxV, Math.min(maxV, b.velocity.x)),
            y: Math.max(-maxV, Math.min(maxV, b.velocity.y)),
          });
        }
        // Rescue if ever out of horizontal bounds
        if (b.position.x < 16 || b.position.x > pitW - 16) {
          Body.setPosition(b, {
            x: Math.max(28, Math.min(pitW - 28, b.position.x)),
            y: Math.min(pitH - 30, b.position.y),
          });
        }
      }
    });

    let inView = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting;
        if (inView && !spawned) {
          spawnPills();
        }
      },
      { threshold: 0.08 }
    );
    io.observe(pit);

    const onResize = () => {
      buildWalls();
      bodiesRef.current.forEach((b, i) => {
        const el = pillElsRef.current[i];
        if (el) {
          b._w = el.offsetWidth || b._w;
          b._h = el.offsetHeight || b._h;
        }
        if (b.position.x > pitW - 30) {
          Body.setPosition(b, { x: pitW - 45, y: b.position.y });
        }
      });
    };
    window.addEventListener('resize', onResize);

    let last = performance.now();
    let rafId = 0;

    const tick = (now) => {
      rafId = requestAnimationFrame(tick);
      if (!inView || !spawned) {
        last = now;
        return;
      }
      const dt = Math.min(22, Math.max(8, now - last));
      last = now;

      Engine.update(engine, dt);

      for (let i = 0; i < bodiesRef.current.length; i++) {
        const b = bodiesRef.current[i];
        const el = pillElsRef.current[i];
        if (!b || !el) continue;
        const x = b.position.x - b._w * 0.5;
        const y = b.position.y - b._h * 0.5;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(
          1
        )}px, 0) rotate(${b.angle.toFixed(3)}rad)`;
        el.style.opacity = '';
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      pit.removeEventListener('pointerleave', onPointerLeave);
      window.removeEventListener('pointerup', onPointerLeave);
      window.removeEventListener('resize', onResize);
      World.clear(engine.world, false);
      Engine.clear(engine);
    };
  }, []);

  const handleFilter = (group) => {
    const { Body } = Matter;
    const next = activeGroup === group ? null : group;
    setActiveGroup(next);

    bodiesRef.current.forEach((b) => {
      if (!next || b._group === next) {
        Body.setVelocity(b, {
          x: (Math.random() - 0.5) * 7,
          y: -(10 + Math.random() * 5.5),
        });
        Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.14);
      }
    });
  };

  const handleShakeAll = () => {
    const { Body } = Matter;
    setActiveGroup(null);
    bodiesRef.current.forEach((b) => {
      Body.setVelocity(b, {
        x: (Math.random() - 0.5) * 11,
        y: -(12 + Math.random() * 7),
      });
      Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.2);
    });
  };

  return (
    <section id="skills" ref={sectionRef} className="skills-section">
      <div className="container">
        <div className="skills-top-row">
          <SectionHeader
            label="05 — Toolbox"
            titleLead="Grab a skill,"
            titleAccent="throw it around."
            theme="dark"
          />

          <div className="skills-filters" role="toolbar" aria-label="Filter skills">
            {DATA.skillGroups.map((grp) => (
              <button
                key={grp}
                type="button"
                className={`skill-filter-btn ${activeGroup === grp ? 'is-active' : ''}`}
                onClick={() => handleFilter(grp)}
              >
                {grp}
              </button>
            ))}
            <button
              type="button"
              className="skill-filter-btn is-shake"
              onClick={handleShakeAll}
            >
              Shake all ↻
            </button>
          </div>
        </div>

        <div ref={pitRef} className="skills-pit" data-cursor="DRAG">
          <div className="skills-pit-watermark" aria-hidden="true">
            STACK
          </div>

          {DATA.skills.map((skill, idx) => {
            const matched = activeGroup === skill.group;
            const dimmed = activeGroup && activeGroup !== skill.group;
            const cls = [
              'skill-matter-pill',
              `variant-${skill.variant}`,
              matched ? 'is-matched' : '',
              dimmed ? 'is-dimmed' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={skill.name}
                ref={(el) => {
                  pillElsRef.current[idx] = el;
                }}
                className={cls}
                data-cursor="DRAG"
              >
                <span>{skill.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

