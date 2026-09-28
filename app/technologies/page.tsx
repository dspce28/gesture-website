import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Technologies' };

export default function Page() {
  return <PagePlaceholder tag="Our Stack" title="Technologies" lead="The languages, frameworks and platforms we build on." />;
}
