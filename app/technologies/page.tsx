'use client';

import { useReveal } from '@/components/Reveal';
import { InnerHero } from '@/components/Ui';

const STACK = [
  {
    label: 'Frontend',
    chips: [
      ['⚛️', 'React.js'], ['▲', 'Next.js'], ['💚', 'Vue.js'], ['🅰️', 'Angular'],
      ['🌬️', 'Tailwind CSS'], ['📘', 'TypeScript'], ['🎭', 'Svelte'],
    ],
  },
  {
    label: 'Backend',
    chips: [
      ['🟢', 'Node.js'], ['🐍', 'Python / FastAPI'], ['🐘', 'PHP / Laravel'],
      ['☕', 'Java / Spring'], ['🦫', 'Go (Golang)'], ['💎', 'Ruby on Rails'],
    ],
  },
  {
    label: 'Mobile',
    chips: [
      ['📱', 'Flutter'], ['⚛️', 'React Native'], ['🍎', 'Swift / iOS'],
      ['🤖', 'Kotlin / Android'],
    ],
  },
  {
    label: 'Cloud & DevOps',
    chips: [
      ['☁️', 'AWS'], ['🔷', 'Azure'], ['🌐', 'Google Cloud'], ['🐳', 'Docker'],
      ['⎈', 'Kubernetes'], ['🔄', 'Jenkins / GitHub Actions'], ['🏗️', 'Terraform'],
    ],
  },
  {
    label: 'Databases',
    chips: [
      ['🐘', 'PostgreSQL'], ['🗄️', 'MySQL'], ['🍃', 'MongoDB'], ['🔴', 'Redis'],
      ['❄️', 'Snowflake'], ['🔥', 'Firebase'], ['🔍', 'Elasticsearch'],
    ],
  },
  {
    label: 'AI & Machine Learning',
    chips: [
      ['🤖', 'TensorFlow'], ['🔥', 'PyTorch'], ['🧠', 'OpenAI GPT'],
      ['📊', 'Scikit-learn'], ['👁️', 'Computer Vision'], ['💬', 'NLP / LangChain'],
    ],
  },
] as const;

export default function Technologies() {
  const page = useReveal<HTMLDivElement>();

  return (
    <div ref={page}>
      <InnerHero
        tag="Tech Stack"
        title={<>Technology <span className="italic">Expertise</span></>}
        lead="Modern, battle-tested technologies chosen for performance, scalability, and developer experience."
      />

      <section className="tech-section">
        <div className="tech-wrap">
          {STACK.map((cat) => (
            <div className="tech-cat-row rev" key={cat.label}>
              <div className="tcat-label">{cat.label}</div>
              <div className="tech-chips">
                {cat.chips.map(([icon, name]) => (
                  <span className="tech-chip" key={name}>
                    <span className="ti">{icon}</span>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
