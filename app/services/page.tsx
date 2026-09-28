'use client';

import Link from 'next/link';
import { useReveal } from '@/components/Reveal';
import { CtaBand, InnerHero } from '@/components/Ui';

const SERVICES = [
  { n: '01', icon: '💻', t: 'Custom Software Development', b: 'End-to-end custom software built for your exact workflows. From CRM to ERP to bespoke platforms — precision engineering from day one.', points: ['Requirement Analysis & Architecture', 'Agile Development & QA', 'Deployment & Maintenance'] },
  { n: '02', icon: '🌐', t: 'Web Development', b: 'SaaS platforms, e-commerce, and web applications built with React, Next.js, and modern stacks for speed, SEO, and scale.', points: ['SaaS & Web Applications', 'E-commerce Platforms', 'CMS & Portal Development'] },
  { n: '03', icon: '📱', t: 'Mobile App Development', b: 'Stunning iOS and Android apps built natively or with Flutter. Smooth, fast, and designed to delight users from day one.', points: ['iOS & Android Native', 'Cross-platform Flutter', 'App Store Optimization'] },
  { n: '04', icon: '☁️', t: 'Cloud Solutions', b: 'Architect, migrate, and optimize on AWS, Azure, and GCP. Reduce infrastructure costs and scale without limits.', points: ['Cloud Migration Strategy', 'Managed Cloud Services', 'DevOps & CI/CD Pipelines'] },
  { n: '05', icon: '🤖', t: 'AI & Automation', b: 'Chatbots, recommendation engines, process automation, computer vision, NLP, and predictive analytics built for production.', points: ['Machine Learning Models', 'RPA & Process Automation', 'AI API Integration'] },
  { n: '06', icon: '🎨', t: 'UI/UX Design', b: 'Research-backed design that converts. Beautiful interfaces built on user research, prototyping, and systematic design thinking.', points: ['User Research & Wireframes', 'High-fidelity Prototyping', 'Design Systems'] },
  { n: '07', icon: '🔒', t: 'Cybersecurity', b: 'Security audits, pen testing, GDPR/HIPAA compliance, and 24/7 monitoring. Enterprise-grade protection for every business.', points: ['Security Audit & Pen Testing', 'Compliance Implementation', '24/7 Security Monitoring'] },
  { n: '08', icon: '💡', t: 'IT Consulting', b: 'Strategic technology advisory — architecture reviews, technology roadmaps, and digital transformation strategies for leadership teams.', points: ['Technology Roadmapping', 'Architecture Review', 'Digital Transformation'] },
  { n: '09', icon: '📈', t: 'Digital Marketing', b: 'SEO, PPC, social media, and content strategies that generate qualified leads and grow your digital presence measurably.', points: ['SEO & Content Marketing', 'PPC & Social Ads', 'Analytics & Reporting'] },
];

export default function Services() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="What We Do"
        title={<>Premium <span className="italic">IT Services</span></>}
        lead="Enterprise-grade technology services delivered by specialists who care about your success."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="services-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {SERVICES.map((s, i) => (
            <Link className={`sc rev d${(i % 3) + 1}`} href="/contact" key={s.n}>
              <div className="sc-num">{s.n}</div>
              <div className="sc-icon">{s.icon}</div>
              <h3>{s.t}</h3>
              <p>{s.b}</p>
              <ul className="sc-points">
                {s.points.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
              <span className="sc-link">
                Get Started <span className="arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <CtaBand
        title={<>Ready to build something <span className="italic" style={{ color: 'var(--gold)' }}>great?</span></>}
        lead="Tell us about your project and get a free expert consultation."
      />
    </div>
  );
}
