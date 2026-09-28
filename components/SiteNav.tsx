'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useGesture } from './GestureProvider';

/** Real routes, replacing the live site's eleven display:none "pages". */
export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/services', label: 'Services' },
  { href: '/products', label: 'Products' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/technologies', label: 'Technologies' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/careers', label: 'Careers' },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const { controllerRef } = useGesture();

  // The nav is fixed, so it cannot key off window.scrollY -- the engine owns
  // the position. Poll it on the render clock instead.
  useEffect(() => {
    let raf = 0;
    let scrolled = false;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = controllerRef.current?.physics.position ?? 0;
      const next = y > 40;
      if (next !== scrolled) {
        scrolled = next;
        navRef.current?.classList.toggle('scrolled', next);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controllerRef]);

  return (
    <>
      <nav id="nav" ref={navRef}>
        <div className="nav-inner">
          <Link className="nav-logo" href="/">
            <Image
              src="/images/cropped-Final-Logicube-3.png"
              alt="LogiCube IT"
              width={140}
              height={38}
              priority
            />
            <span>
              LogiCube <em>IT</em>
            </span>
          </Link>

          <div className="nav-links">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={pathname === item.href ? 'active' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link href="/contact" className="nav-cta">
            Let&apos;s Talk →
          </Link>

          <button
            className="hamburger"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Closed from the click that navigates, rather than from an effect
          watching the path: the click is what actually caused the change. */}
      <div className={`mobile-nav${open ? ' open' : ''}`} id="mnav">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <Link href="/contact" onClick={() => setOpen(false)}>
          Contact
        </Link>
      </div>
    </>
  );
}
