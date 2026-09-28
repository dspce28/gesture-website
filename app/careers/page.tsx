'use client';

import Link from 'next/link';
import { useReveal } from '@/components/Reveal';
import { InnerHero, SectionHead } from '@/components/Ui';

const PERKS = [
  { icon: '💰', t: 'Competitive Salary', b: 'Top-market compensation with annual reviews and performance bonuses tied to real outcomes.' },
  { icon: '🏠', t: 'Remote Friendly', b: 'Flexible work-from-home policy. Work from anywhere in India with async-first culture.' },
  { icon: '📚', t: 'Learning Budget', b: '₹30,000/year for courses, conferences, certifications, books, and skill development.' },
  { icon: '🏥', t: 'Health Insurance', b: 'Comprehensive medical coverage for you and your immediate family, from day one.' },
  { icon: '🚀', t: 'Fast Career Growth', b: 'Clear career ladders, quarterly reviews, and real promotion opportunities — not just promises.' },
  { icon: '🎮', t: 'Work-Life Balance', b: '25 days PTO, mental health days, and a culture that genuinely respects your time.' },
];

const ROLES = [
  { t: 'Senior Full-Stack Developer', dept: 'Engineering', type: 'Full Time', loc: '📍 Ahmedabad / Remote' },
  { t: 'Flutter Mobile Developer', dept: 'Mobile', type: 'Full Time', loc: '📍 Remote' },
  { t: 'UI/UX Designer', dept: 'Design', type: 'Full Time', loc: '📍 Ahmedabad / Hybrid' },
  { t: 'AI / ML Engineer', dept: 'AI & Data', type: 'Full Time', loc: '📍 Remote' },
  { t: 'DevOps / Cloud Engineer', dept: 'Infrastructure', type: 'Full Time', loc: '📍 Remote' },
  { t: 'Business Development Manager', dept: 'Sales', type: 'Full Time', loc: '📍 Ahmedabad' },
];

export default function Careers() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Join Us"
        title={<>Build the future <span className="italic">with us</span></>}
        lead="We are hiring talented people who want to build exceptional technology at a company that truly invests in its team."
      />

      <section style={{ background: 'var(--white)' }}>
        <SectionHead
          tag="Why LogiCube"
          gold
          title={<>Perks & <span className="italic">benefits</span></>}
        />
        <div className="benefits-grid">
          {PERKS.map((p, i) => (
            <div className={`benefit-box rev d${(i % 3) + 1}`} key={p.t}>
              <span className="bb-icon">{p.icon}</span>
              <h4>{p.t}</h4>
              <p>{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg)' }}>
        <SectionHead
          tag="Open Roles"
          title={<>Current <span className="italic">openings</span></>}
        />
        <div className="jobs-list">
          {ROLES.map((r, i) => (
            <div className={`job-row rev d${(i % 3) + 1}`} key={r.t}>
              <div className="jr-info">
                <h4>{r.t}</h4>
                <div className="jr-tags">
                  <span className="jt jt-dept">{r.dept}</span>
                  <span className="jt jt-type">{r.type}</span>
                  <span className="jt jt-loc">{r.loc}</span>
                </div>
              </div>
              <Link className="btn btn-navy job-apply" href="/contact">
                Apply Now →
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
