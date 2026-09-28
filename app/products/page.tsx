import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Products' };

export default function Page() {
  return <PagePlaceholder tag="Our Products" title="Products" lead="Platforms and tools built from what we learned delivering 200+ projects." />;
}
