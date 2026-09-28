'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useReveal } from '@/components/Reveal';
import { CtaBand, InnerHero } from '@/components/Ui';

const FILTERS = ['All Projects', 'Web Apps', 'Mobile Apps', 'Enterprise', 'AI Solutions'] as const;
type Filter = (typeof FILTERS)[number];

const PROJECTS: Array<{
  img: string;
  cat: string;
  t: string;
  b: string;
  tags: string[];
  groups: Filter[];
}> = [
  { img: '/images/technology-web-application.jpg', cat: 'Enterprise Software', t: 'Enterprise Resource Platform', b: 'Full-stack ERP replacing 6 legacy systems for a 1,000+ employee manufacturing company. 60% efficiency gain.', tags: ['React', 'Node.js', 'AWS', 'PostgreSQL'], groups: ['Enterprise', 'Web Apps'] },
  { img: '/images/mobile-app-developmet-1.png', cat: 'Healthcare · Mobile', t: 'MedConnect Telemedicine', b: 'HIPAA-compliant telemedicine with video consultations, e-prescriptions, and AI symptom checker. 50K+ users.', tags: ['Flutter', 'Python', 'Firebase', 'AI/ML'], groups: ['Mobile Apps', 'AI Solutions'] },
  { img: '/images/trends-in-digital-marketing.png', cat: 'Marketing · AI', t: 'GrowthEngine Marketing Platform', b: 'AI-powered marketing automation with multi-channel campaigns and real-time analytics. 3× ROI improvement.', tags: ['Vue.js', 'Python', 'OpenAI', 'Redis'], groups: ['AI Solutions', 'Web Apps'] },
  { img: '/images/Web_Development.png', cat: 'E-commerce', t: 'NexaStore Commerce Platform', b: 'Headless e-commerce with 10,000+ SKUs, real-time inventory, multi-currency. ₹2Cr+ monthly GMV.', tags: ['Next.js', 'Strapi', 'Stripe', 'Vercel'], groups: ['Web Apps'] },
  { img: '/images/Image-3.png', cat: 'Analytics · Fintech', t: 'DataSight Analytics Platform', b: 'BI platform processing 100M+ events/day with predictive analytics and executive reporting dashboards.', tags: ['React', 'Python', 'Kafka', 'Snowflake'], groups: ['Enterprise', 'AI Solutions'] },
  { img: '/images/BG-1-3.jpg', cat: 'Cybersecurity', t: 'SecureShield Security Platform', b: 'Enterprise security dashboard with real-time threat monitoring and automated incident response. Fortune 500 client.', tags: ['Angular', 'Go', 'Kubernetes', 'Elastic'], groups: ['Enterprise'] },
];

export default function Portfolio() {
  const page = useReveal<HTMLDivElement>();
  const [filter, setFilter] = useState<Filter>('All Projects');

  // The original filter buttons were decorative; wiring them costs nothing and
  // gives the gesture cursor something real to click on this page.
  const shown =
    filter === 'All Projects'
      ? PROJECTS
      : PROJECTS.filter((p) => p.groups.includes(filter));

  return (
    <div ref={page}>
      <InnerHero
        tag="Our Work"
        title={<>Portfolio & <span className="italic">case studies</span></>}
        lead="Real projects. Measurable results. 200+ delivered across industries."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="port-filters rev">
          {FILTERS.map((f) => (
            <button
              className={f === filter ? 'pf active' : 'pf'}
              onClick={() => setFilter(f)}
              key={f}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="port-grid">
          {shown.map((p, i) => (
            <div className={`port-card rev d${(i % 3) + 1} in`} key={p.t}>
              <div className="port-img">
                <Image src={p.img} alt={p.t} width={520} height={340} />
                <div className="port-overlay">
                  <span className="btn port-view">View Details</span>
                </div>
              </div>
              <div className="port-body">
                <div className="port-cat">{p.cat}</div>
                <h4>{p.t}</h4>
                <p>{p.b}</p>
                <div className="port-tags">
                  {p.tags.map((t) => (
                    <span className="pt" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {shown.length === 0 && (
          <p className="lead" style={{ textAlign: 'center' }}>
            Nothing in this category yet.
          </p>
        )}
      </section>

      <CtaBand
        title={<>Have a project in mind? <span className="italic" style={{ color: 'var(--gold)' }}>Let us build it.</span></>}
        lead="Every great product starts with a conversation."
        cta="Start Your Project"
      />
    </div>
  );
}
