'use client';

import { useReveal } from '@/components/Reveal';
import { CtaBand, InnerHero } from '@/components/Ui';

const SOLUTIONS = [
  { n: '01', icon: '🏢', t: 'Enterprise Solutions', b: 'Scalable, secure, integrable systems for large organizations with complex workflows and compliance requirements.', points: ['Custom ERP & CRM Systems', 'Legacy System Modernization', 'Enterprise API Integration', 'Business Intelligence & Analytics'] },
  { n: '02', icon: '🚀', t: 'Startup Solutions', b: 'Rapid MVP development, lean product iterations, and scalable architectures that evolve with your growth trajectory.', points: ['MVP in 8–12 Weeks', 'Scalable Cloud Architecture', 'Investor-Ready Tech Stack', 'Growth Engineering'] },
  { n: '03', icon: '🛒', t: 'E-commerce Solutions', b: 'End-to-end commerce ecosystems — storefront, payments, inventory, logistics, and analytics — built to convert.', points: ['Custom E-commerce Platforms', 'Headless Commerce', 'Payment Gateway Integration', 'Conversion Optimization'] },
  { n: '04', icon: '🏥', t: 'Healthcare Solutions', b: 'HIPAA-compliant healthcare platforms including telemedicine, patient portals, EHR integration, and health analytics.', points: ['Telemedicine Platforms', 'EHR / EMR Integration', 'Patient Portal Development', 'HIPAA & HL7 Compliance'] },
  { n: '05', icon: '🎓', t: 'Education Solutions', b: 'Feature-rich LMS, e-learning platforms, virtual classrooms, and student management systems for modern education.', points: ['Custom LMS Development', 'Video Learning Platforms', 'AI-Powered Learning Paths', 'Gamification & Assessment'] },
  { n: '06', icon: '💳', t: 'Fintech Solutions', b: 'Secure, compliance-ready financial technology — neobanking, payment platforms, investment tools, and fraud detection.', points: ['Payment Processing Platforms', 'KYC & AML Compliance', 'Fraud Detection (AI)', 'Crypto & DeFi Solutions'] },
];

export default function Solutions() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Industry Solutions"
        title={<>Built for your <span className="italic">industry</span></>}
        lead="Deep domain expertise across the industries that matter most to modern business."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="sol-grid">
          {SOLUTIONS.map((s, i) => (
            <div className={`sol-card rev d${(i % 3) + 1}`} data-num={s.n} key={s.n}>
              <span className="sol-icon">{s.icon}</span>
              <h3>{s.t}</h3>
              <p>{s.b}</p>
              <ul className="sol-list">
                {s.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title={<>Do not see your industry? <span className="italic" style={{ color: 'var(--gold)' }}>Let us talk.</span></>}
        lead="We have built solutions for 20+ industries. Share your challenge and we will find the approach."
        cta="Get Custom Quote"
      />
    </div>
  );
}
