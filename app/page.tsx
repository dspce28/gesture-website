'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCountUp, useReveal } from '@/components/Reveal';

const SERVICES = [
  { n: '01', icon: '💻', t: 'Custom Software Development', b: 'Tailored software built precisely for your workflows, processes, and scale. No templates — pure custom engineering.' },
  { n: '02', icon: '🌐', t: 'Web Development', b: 'High-performance web apps and SaaS platforms built with React, Next.js, and modern stacks.' },
  { n: '03', icon: '📱', t: 'Mobile App Development', b: 'Native iOS and Android apps — or cross-platform Flutter solutions. Fast, beautiful, scalable.' },
  { n: '04', icon: '☁️', t: 'Cloud Solutions', b: 'Cloud infrastructure, migration, and DevOps on AWS, Azure, and GCP. Reduce costs, maximize uptime.' },
  { n: '05', icon: '🤖', t: 'AI & Automation', b: 'Machine learning, intelligent automation, and AI-powered products that transform how your business operates.' },
  { n: '06', icon: '🔒', t: 'Cybersecurity', b: 'Enterprise security audits, pen testing, compliance implementation, and 24/7 monitoring.' },
];

const REASONS = [
  { n: '01', t: 'Precision Engineering', b: 'Every system we build is architected for performance, maintainability, and scale. We write code like it will be maintained for 10 years — because it will be.' },
  { n: '02', t: 'Agile, Transparent Delivery', b: 'Bi-weekly demos, real-time project dashboards, and a dedicated account manager. You are never left wondering what is happening.' },
  { n: '03', t: 'Security by Design', b: 'Enterprise-grade security standards are built in from day one — not bolted on at the end. ISO 27001 compliant processes across every project.' },
  { n: '04', t: 'Long-Term Partnership', b: 'We do not disappear after launch. 98% of our clients return for follow-on work because we invest in relationships that last.' },
];

const WORK = [
  { img: '/images/technology-web-application.jpg', cat: 'Enterprise Software', t: 'Enterprise Resource Platform', b: 'Full-stack ERP replacing 6 legacy systems for 1000+ employee manufacturing firm.', tags: ['React', 'Node.js', 'AWS'] },
  { img: '/images/mobile-app-developmet-1.png', cat: 'Healthcare · Mobile', t: 'MedConnect Telemedicine App', b: 'HIPAA-compliant telemedicine platform with AI symptom checker. 50K+ users.', tags: ['Flutter', 'Python', 'AI/ML'] },
  { img: '/images/trends-in-digital-marketing.png', cat: 'Analytics · Fintech', t: 'DataSight Analytics Dashboard', b: 'Real-time BI platform processing 100M+ events daily with predictive analytics.', tags: ['React', 'Kafka', 'Snowflake'] },
];

const QUOTES = [
  { q: 'LogiCube IT transformed our entire operations with a custom ERP. The team delivered beyond expectations — our efficiency improved by 60% within 3 months of launch.', i: 'RS', n: 'Rahul Sharma', r: 'CEO, TechCorp India' },
  { q: 'Exceptional mobile app development. They understood our complex healthcare requirements and delivered a HIPAA-compliant solution in record time. Truly world-class.', i: 'AM', n: 'Anita Mehta', r: 'CTO, MedAxis' },
  { q: 'The AI automation solution LogiCube built saves our team 40+ hours per week. Their technical expertise, communication, and commitment to quality is unmatched.', i: 'KP', n: 'Kyle Peterson', r: 'Director, CloudEdge US' },
];

const MARQUEE = [
  'Custom Software', 'Web Development', 'Mobile Apps', 'Cloud Solutions',
  'AI & Automation', 'Cybersecurity', 'UI/UX Design', 'IT Consulting',
  'Digital Transformation',
];

export default function Home() {
  const page = useReveal<HTMLDivElement>();
  const counter = useCountUp(47);

  return (
    <div ref={page}>
      <section className="hero">
        <div className="hero-mesh" />
        <div className="hero-dots" />
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-eyebrow rev">
              <div className="hero-eyebrow-line" />
              <span>Premium IT Solutions Since 2016</span>
            </div>
            <h1 className="display rev d1">
              Transform Your<br />Business With<br />
              <span className="italic">Smart IT Solutions</span>
            </h1>
            <p className="hero-desc rev d2">
              We build scalable software, powerful digital platforms, and
              enterprise technology solutions that drive real growth and lasting
              impact.
            </p>
            <div className="btn-row rev d3">
              <Link className="btn btn-navy" href="/contact">
                Get Free Consultation
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link className="btn btn-outline" href="/portfolio">
                View Our Work
              </Link>
            </div>
            <div className="hero-social-proof rev d4">
              <div className="avatars">
                {['RS', 'AM', 'KP', 'VJ'].map((a) => (
                  <span key={a}>{a}</span>
                ))}
              </div>
              <div>
                <div className="stars-row">★★★★★</div>
                <p className="sp-text">
                  <strong>200+ clients</strong> trust LogiCube IT worldwide
                </p>
              </div>
            </div>
          </div>

          <div className="hero-right rev-r">
            <div className="floating-pill fp1" style={{ color: 'var(--blue)' }}>
              <span style={{ background: 'var(--blue)', width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
              Live Project Dashboard
            </div>
            <div className="floating-pill fp2"><span>🚀</span> 98% Client Satisfaction</div>
            <div className="floating-pill fp3"><span>⚡</span> Fast Delivery</div>
            <div className="floating-pill fp4" style={{ color: 'var(--gold-dk)' }}><span>🏆</span> Award Winning</div>

            <div className="hero-card-main">
              <div className="hcm-header">
                <div className="hcm-logo">
                  <Image src="/images/cropped-Final-Logicube-3.png" alt="" width={28} height={28} />
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--navy)' }}>LogiCube</span>
                </div>
                <div className="hcm-badge">Live</div>
              </div>
              <div className="hcm-metric">
                <div className="hcm-metric-label">Projects Delivered This Year</div>
                <div className="hcm-metric-value" ref={counter}>0</div>
                <div className="hcm-metric-sub">↑ 34% from last year</div>
              </div>
              <div className="hcm-bars">
                {[1, 2, 3, 4, 5, 6, 7].map((b) => (
                  <div key={b} className={'bar b' + b} />
                ))}
              </div>
              <div className="hcm-row">
                <div className="hcm-stat"><strong style={{ color: 'var(--blue)' }}>50+</strong><p>Developers</p></div>
                <div className="hcm-stat"><strong style={{ color: 'var(--navy)' }}>25+</strong><p>Countries</p></div>
                <div className="hcm-stat"><strong style={{ color: 'var(--gold)' }}>8yr</strong><p>Experience</p></div>
                <div className="hcm-dot" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="marquee-wrap">
        <div className="marquee-inner">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <div className="marquee-item" key={m + i}>
              <span>✦</span> {m}
            </div>
          ))}
        </div>
      </div>

      <section style={{ background: 'var(--bg)' }}>
        <div className="sh rev">
          <div className="tag">What We Build</div>
          <h2 className="display">
            Services that <span className="italic">move</span> businesses
          </h2>
          <p className="lead">
            From ideation to deployment — we handle the full technology stack so
            you can focus on growth.
          </p>
        </div>
        <div className="services-grid rev">
          {SERVICES.map((s) => (
            <Link className="sc" href="/services" key={s.n}>
              <div className="sc-num">{s.n}</div>
              <div className="sc-icon">{s.icon}</div>
              <h3>{s.t}</h3>
              <p>{s.b}</p>
              <span className="sc-link">
                Explore service <span className="arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link className="btn btn-outline" href="/services">View All Services</Link>
        </div>
      </section>

      <section>
        <div className="sh rev">
          <div className="tag tag-gold">Why Choose Us</div>
          <h2 className="display">
            Why leading companies<br />choose <span className="italic">LogiCube IT</span>
          </h2>
        </div>
        <div className="why-grid rev">
          {REASONS.map((r) => (
            <div className="wc" key={r.n}>
              <div className="wc-num">{r.n}</div>
              <h3>{r.t}</h3>
              <p>{r.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg)' }}>
        <div className="sh rev">
          <div className="tag">Our Work</div>
          <h2 className="display">
            Projects that <span className="italic">speak</span> for themselves
          </h2>
          <p className="lead">
            A curated selection from 200+ delivered projects across industries.
          </p>
        </div>
        <div className="port-grid rev">
          {WORK.map((w) => (
            <Link className="port-card" href="/portfolio" key={w.t}>
              <div className="port-img">
                <Image src={w.img} alt={w.t} width={520} height={340} />
                <div className="port-overlay"><span className="btn">View Project</span></div>
              </div>
              <div className="port-body">
                <div className="port-cat">{w.cat}</div>
                <h4>{w.t}</h4>
                <p>{w.b}</p>
                <div className="port-tags">
                  {w.tags.map((t) => (
                    <span className="pt" key={t}>{t}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link className="btn btn-navy" href="/portfolio">See All Projects</Link>
        </div>
      </section>

      <section>
        <div className="sh rev">
          <div className="tag tag-gold">Client Stories</div>
          <h2 className="display">
            Trusted by <span className="italic">ambitious</span> teams
          </h2>
        </div>
        <div className="test-grid rev">
          {QUOTES.map((q) => (
            <div className="tc" key={q.i}>
              <div className="stars-row">★★★★★</div>
              <p className="tc-quote">&ldquo;{q.q}&rdquo;</p>
              <div className="tc-author">
                <div className="tc-avatar">{q.i}</div>
                <div>
                  <strong>{q.n}</strong>
                  <p>{q.r}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-section rev">
        <div className="tag tag-gold">Start Today</div>
        <h2 className="display">
          Ready to build something <span className="italic">extraordinary</span>?
        </h2>
        <p className="lead">
          Join 200+ companies that trust LogiCube IT to power their digital
          future.
        </p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <Link className="btn btn-gold" href="/contact">Book Free Consultation</Link>
          <Link className="btn btn-outline" href="/pricing">View Pricing</Link>
        </div>
      </section>
    </div>
  );
}
