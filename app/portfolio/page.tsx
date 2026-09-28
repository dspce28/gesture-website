import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Portfolio' };

export default function Page() {
  return <PagePlaceholder tag="Our Work" title="Portfolio" lead="A curated selection from 200+ delivered projects." />;
}
