'use client';

import Link from 'next/link';
import { useReveal } from '@/components/Reveal';
import { InnerHero } from '@/components/Ui';

const TIERS = [
  {
    tier: 'Starter',
    price: '₹49K',
    unit: ' / project',
    desc: 'Perfect for startups & small businesses launching their first digital product.',
    cta: 'Get Started',
    featured: false,
    features: [
      'Up to 10 Pages / Screens', 'Responsive Web Design', 'Basic CMS Integration',
      'Contact Form & Email Setup', '3 Months Support', 'Google Analytics Setup',
      'Basic SEO Optimization',
    ],
  },
  {
    tier: 'Professional',
    price: '₹1.5L',
    unit: ' / project',
    desc: 'For growing businesses that need custom solutions and professional delivery.',
    cta: 'Get Started',
    featured: true,
    features: [
      'Custom Software / App', 'Up to 25 Features / Modules', 'Full UI/UX Design',
      'API Development', 'Admin Dashboard', '6 Months Support', 'Cloud Deployment',
      'Performance Optimization', 'Priority Communication',
    ],
  },
  {
    tier: 'Enterprise',
    price: 'Custom',
    unit: ' pricing',
    desc: 'For organizations with complex, multi-system requirements and enterprise compliance needs.',
    cta: 'Contact Sales',
    featured: false,
    features: [
      'Unlimited Complexity', 'Dedicated Dev Team', 'Architecture Consulting',
      'Enterprise Integrations', '24/7 Support & SLA', 'Security Audit Included',
      'Compliance Setup', 'Dedicated Account Manager', 'Monthly Executive Reports',
    ],
  },
];

export default function Pricing() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Transparent Pricing"
        title={<>Simple, <span className="italic">honest</span> pricing</>}
        lead="No hidden fees. No surprises. Clear pricing for every business size."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="pricing-wrap">
          {TIERS.map((t, i) => (
            <div
              className={`pc${t.featured ? ' featured' : ''} rev d${i + 1}`}
              key={t.tier}
            >
              {t.featured && <div className="pc-badge">Most Popular</div>}
              <div className="pc-tier">{t.tier}</div>
              <div className="pc-price">
                <strong>{t.price}</strong>
                <span>{t.unit}</span>
              </div>
              <p className="pc-desc">{t.desc}</p>
              <div className="pc-divider" />
              <ul className="pc-features">
                {t.features.map((f) => (
                  <li key={f}>
                    <span className="ck">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                className={`btn ${t.featured ? 'btn-gold' : 'btn-outline'}`}
                style={{ width: '100%', justifyContent: 'center' }}
                href="/contact"
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>

        <p
          className="rev"
          style={{
            textAlign: 'center',
            color: 'var(--muted)',
            marginTop: '2.5rem',
            fontSize: '.85rem',
          }}
        >
          All prices in INR · International billing available · Monthly retainer
          packages available
        </p>
      </section>
    </div>
  );
}
