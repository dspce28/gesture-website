import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Solutions' };

export default function Page() {
  return <PagePlaceholder tag="Industry Solutions" title="Solutions" lead="Technology shaped around how your industry actually works." />;
}
