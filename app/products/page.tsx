'use client';

import { useReveal } from '@/components/Reveal';
import { CtaBand, InnerHero } from '@/components/Ui';

/** LogiCube's own SaaS products, live in production. */
const PRODUCTS = [
  { href: 'https://docketsync.logicubeit.com/', badge: 'Live', icon: '📋', t: 'DocketSync', b: 'Legal practice automation for Gujarat High Court advocates — cause lists parsed nightly straight into the calendar, courtroom dictation turned into filing-ready Word drafts, and scanned orders converted back to editable documents.' },
  { href: 'https://medslay.com/', badge: 'Live', icon: '🩺', t: 'MedSlay', b: 'AI voice consultation documentation for doctors — speak through an OPD visit and MedSlay turns it into structured clinical notes, integrated directly into Odoo HMS.' },
  { href: 'https://connect.logicubeit.com/', badge: 'Coming Soon', icon: '💬', t: 'Connect', b: 'Automated WhatsApp, SMS, and RSS communication for businesses — handling customer queries, broadcasts, and updates on one connected channel.' },
  { href: 'https://reel.logicubeit.com/', badge: 'Live', icon: '🎬', t: 'Reel', b: 'Pre-release performance intelligence for short-form video — upload a reel with its campaign context and get algorithm-aware scoring, hook suggestions, and a prioritized action plan before it goes live.' },
  { href: 'https://adsense.logicubeit.com/', badge: 'Live', icon: '📊', t: 'AdSense AI', b: 'Elite ad-performance analysis for video ads — feed in the creative plus campaign, audience, and budget details, and get algorithm insights, hook analysis, and a launch strategy back.' },
  { href: 'https://divyank.logicubeit.com/', badge: 'Live', icon: '♿', t: 'Divyank', b: 'Standardized disability assessment built for India’s RPwD Act, 2016 — guideline-exact calculators across 21 specified disabilities, with every score traceable to the clause that produced it.' },
];

export default function Products() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Built In-House"
        title={<>Our own <span className="italic">products</span></>}
        lead="Beyond client work, we build and run our own SaaS products — live in production, used by real customers today."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="prod-grid">
          {PRODUCTS.map((p, i) => (
            <a
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`prod-card rev d${(i % 3) + 1}`}
              key={p.t}
            >
              <span className={`prod-badge ${p.badge === 'Live' ? 'live' : 'soon'}`}>
                {p.badge}
              </span>
              <div className="prod-icon">{p.icon}</div>
              <h4>{p.t}</h4>
              <p>{p.b}</p>
              <span className="prod-link">
                Visit {p.t} <span className="arrow">→</span>
              </span>
            </a>
          ))}
        </div>
      </section>

      <CtaBand
        title={<>Want something like this <span className="italic" style={{ color: 'var(--gold)' }}>built for you?</span></>}
        lead="These products started as ideas too. Tell us yours."
        cta="Talk to Us"
      />
    </div>
  );
}
