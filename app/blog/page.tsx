import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Blog' };

export default function Page() {
  return <PagePlaceholder tag="Insights" title="Blog" lead="Notes on engineering, delivery and the technology we work with." />;
}
