'use client';

import { useReveal } from '@/components/Reveal';
import { CtaBand, PageHero, SectionHead, StatTile } from '@/components/Ui';

const VALUES = [
  { icon: '🎯', t: 'Excellence', b: 'We hold ourselves to the highest standards in every line of code and every client interaction.' },
  { icon: '🤝', t: 'Partnership', b: 'We treat every client’s business as our own — your goals become our goals, always.' },
  { icon: '💡', t: 'Innovation', b: 'We constantly explore emerging technologies and bring the best of them to our clients’ advantage.' },
  { icon: '🔍', t: 'Integrity', b: 'Transparency in pricing, timelines, and communication. No hidden agendas, ever.' },
];

const TIMELINE = [
  { y: '2016', t: 'Company Founded', b: 'LogiCube IT launched in Ahmedabad with a 5-member team and a mission to build world-class software.' },
  { y: '2017', t: 'First Enterprise Client', b: 'Delivered a custom ERP for a 500-user manufacturing company — our first major enterprise contract.' },
  { y: '2019', t: 'International Expansion', b: 'Expanded to USA, UK, UAE. Team grew to 25. Launched our Cloud & DevOps practice.' },
  { y: '2021', t: 'AI & Automation Division', b: 'Launched dedicated AI/ML practice. Delivered 30+ automation projects saving clients thousands of hours monthly.' },
  { y: '2023', t: '100 Projects Milestone', b: 'Celebrated delivery of our 100th major project. Team expanded to 50+ specialists across 8 disciplines.' },
  { y: '2025', t: '200+ Projects, 25+ Countries', b: 'Recognized as a Top IT Company in India with 98% client satisfaction and global enterprise partnerships.' },
];

const TEAM = [
  { a: '👨‍💼', bg: 'var(--blue-lt)', n: 'Arjun Patel', r: 'CEO & Co-Founder', b: '15+ years in enterprise software. Previously at TCS and Infosys.' },
  { a: '👩‍💻', bg: 'var(--gold-lt)', n: 'Priya Mehta', r: 'CTO & Co-Founder', b: 'Full-stack architect. Led engineering at multiple successful startups.' },
  { a: '👨‍🎨', bg: '#FFF0F5', n: 'Rohan Shah', r: 'Head of Design', b: 'Award-winning UX designer creating experiences people love.' },
  { a: '👩‍🔬', bg: '#F0FFF4', n: 'Kavya Reddy', r: 'Head of AI/ML', b: 'PhD in Computer Science. Specializes in production-grade ML systems.' },
];

export default function About() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <PageHero
        tag="Our Story"
        title={<>We are<br /><span className="italic">LogiCube IT</span></>}
        lead="Founded on the belief that great technology genuinely changes businesses. Since 2016, we have grown from a 5-member startup to a 50+ specialist team serving enterprises across 25+ countries."
        cta="Work With Us"
        aside={
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <StatTile value="200+" label="Projects" bg="var(--blue-lt)" />
            <StatTile value="50+" label="Specialists" bg="var(--gold-lt)" />
            <StatTile value="25+" label="Countries" bg="var(--white)" border />
            <StatTile
              value="98%"
              label="Satisfaction"
              bg="var(--navy)"
              fg="var(--white)"
              labelFg="rgba(255,255,255,.5)"
            />
          </div>
        }
      />

      <section style={{ background: 'var(--bg)' }}>
        <SectionHead tag="Values" title={<>What <span className="italic">drives</span> us</>} />
        <div className="value-grid">
          {VALUES.map((v, i) => (
            <div className={`vc rev d${i + 1}`} key={v.t}>
              <div className="vc-icon">{v.icon}</div>
              <h4>{v.t}</h4>
              <p>{v.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--white)' }}>
        <SectionHead tag="Journey" title={<>Our <span className="italic">timeline</span></>} />
        <div className="timeline rev">
          {TIMELINE.map((t) => (
            <div className="ti-item" key={t.y}>
              <div className="ti-year">{t.y}</div>
              <h4>{t.t}</h4>
              <p>{t.b}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--bg)' }}>
        <SectionHead tag="Leadership" title={<>The <span className="italic">team</span> behind it all</>} />
        <div className="team-grid">
          {TEAM.map((m, i) => (
            <div className={`team-card rev d${i + 1}`} key={m.n}>
              <div className="team-avatar" style={{ background: m.bg }}>{m.a}</div>
              <h4>{m.n}</h4>
              <div className="role">{m.r}</div>
              <p>{m.b}</p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand
        title="Ready to work with us?"
        lead="Let us start a conversation about your project."
      />
    </div>
  );
}
