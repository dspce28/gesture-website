import type { Metadata } from 'next';
import { PagePlaceholder } from '@/components/PagePlaceholder';

export const metadata: Metadata = { title: 'Contact' };

export default function Page() {
  return <PagePlaceholder tag="Let's Talk" title="Contact" lead="Tell us what you are building and we will get back within one business day." />;
}
