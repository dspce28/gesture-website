import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'About' };

export default function Page() {
  return <PagePlaceholder tag="Who We Are" title="About" lead="Eight years building software that lasts, for clients in 25 countries." />;
}
