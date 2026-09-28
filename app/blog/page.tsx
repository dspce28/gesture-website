'use client';

import Image from 'next/image';
import { useReveal } from '@/components/Reveal';
import { InnerHero } from '@/components/Ui';

const POSTS = [
  { img: '/images/1774545979938_9.png', cat: 'AI & Machine Learning', t: 'Top 10 AI Trends Every Business Leader Must Know in 2025', b: 'From generative AI to agentic systems — what is reshaping every industry and what to do about it now.', date: 'Jan 15, 2025', read: '8 min read' },
  { img: '/images/1774545979940_13.png', cat: 'Cloud Computing', t: 'Cloud Migration in 2025: A Strategic Guide for Enterprises', b: 'How to plan, execute, and optimize your migration without disrupting operations or blowing budget.', date: 'Feb 3, 2025', read: '12 min read' },
  { img: '/images/1774545979939_12.png', cat: 'Software Development', t: 'Why Agile Alone Is Not Enough: Outcome-Driven Development', b: 'Moving beyond sprints and velocity to measure what truly matters — business outcomes and user value.', date: 'Feb 20, 2025', read: '7 min read' },
  { img: '/images/trends-in-digital-marketing.png', cat: 'Digital Marketing', t: 'Performance Marketing in 2025: Data-Driven Strategies That Work', b: 'How leading brands combine AI, first-party data, and creative automation to dominate digital.', date: 'Mar 5, 2025', read: '9 min read' },
  { img: '/images/BG-1-3.jpg', cat: 'Cybersecurity', t: 'The 5 Biggest Cybersecurity Threats Businesses Face Right Now', b: 'Real-world attack vectors targeting businesses — and the practical defenses that actually work.', date: 'Mar 12, 2025', read: '10 min read' },
  { img: '/images/1774545979942_15.png', cat: 'Mobile Development', t: 'Flutter vs React Native in 2025: Which Should You Choose?', b: 'A definitive technical comparison to help you pick the right framework for your next mobile product.', date: 'Mar 18, 2025', read: '11 min read' },
];

export default function Blog() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Insights"
        title={<>Tech blog & <span className="italic">resources</span></>}
        lead="Industry insights, technical deep-dives, and technology trends from our expert team."
      />

      <section style={{ background: 'var(--bg)' }}>
        <div className="blog-grid">
          {POSTS.map((p, i) => (
            <article className={`blog-card rev d${(i % 3) + 1}`} key={p.t}>
              <div className="bc-img">
                <Image src={p.img} alt="" width={520} height={300} />
              </div>
              <div className="bc-body">
                <div className="bc-cat">{p.cat}</div>
                <h4>{p.t}</h4>
                <p>{p.b}</p>
                <div className="bc-meta">
                  <span>{p.date}</span>
                  <span>·</span>
                  <span>{p.read}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
