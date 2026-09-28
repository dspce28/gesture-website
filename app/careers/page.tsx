import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Careers' };

export default function Page() {
  return <PagePlaceholder tag="Join Us" title="Careers" lead="We hire engineers who care how things are built." />;
}
