import { useEffect, useState } from 'react';
import { DATA } from '../data';

const NAV_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Numbers', href: '#numbers' },
  { label: 'Work', href: '#work' },
  { label: 'Skills', href: '#skills' },
  { label: 'Journey', href: '#journey' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ onNavigate }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1100 && menuOpen) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [menuOpen]);

  const handleLink = (e, href) => {
    e.preventDefault();
    setMenuOpen(false);
    onNavigate?.(href);
  };

  return (
    <>
      <header className="hero-nav">
        <a
          href="#hero"
          className="nav-brand"
          onClick={(e) => handleLink(e, '#hero')}
          aria-label={DATA.fullName}
        >
          <span className="nav-initials">{DATA.initials}</span>
          <span className="nav-copy">©</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-roll-link"
              onClick={(e) => handleLink(e, item.href)}
            >
              <span className="nav-roll-inner">
                <span>{item.label}</span>
                <span aria-hidden="true">{item.label}</span>
              </span>
            </a>
          ))}
        </nav>

        <div className="nav-actions">
          <a href={`mailto:${DATA.email}`} className="nav-status-pill">
            <span className="nav-status-dot" aria-hidden="true" />
            <span>Open to work</span>
          </a>

          <button
            type="button"
            className={`nav-burger ${menuOpen ? 'is-open' : ''}`}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-top">
          <span className="mobile-menu-brand">
            {DATA.initials}
            <small>©</small>
          </span>
          <button
            type="button"
            className="mobile-menu-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            Close ✕
          </button>
        </div>

        <nav className="mobile-menu-links" aria-label="Mobile navigation">
          {NAV_LINKS.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              className="mobile-menu-link"
              onClick={(e) => handleLink(e, item.href)}
            >
              <span className="mobile-menu-idx">0{idx + 1}</span>
              <span className="mobile-menu-text">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mobile-menu-footer">
          <a href={`mailto:${DATA.email}`} className="nav-status-pill is-light">
            <span className="nav-status-dot" aria-hidden="true" />
            <span>Open to work — {DATA.email}</span>
          </a>
        </div>
      </div>
    </>
  );
}

