import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Pricing' };

export default function Page() {
  return <PagePlaceholder tag="Engagement Models" title="Pricing" lead="Transparent pricing built around how you want to work." />;
}
