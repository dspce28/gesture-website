import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Services' };

export default function Page() {
  return <PagePlaceholder tag="What We Build" title="Services" lead="From ideation to deployment across the full technology stack." />;
}
