import Link from 'next/link';

/**
 * Temporary shell for routes whose content has not been ported from the
 * single-file site yet. Keeps every nav link resolving to a real URL so the
 * gesture cursor, click handling and routing can all be exercised end to end.
 */
export function PagePlaceholder({
  tag,
  title,
  lead,
}: {
  tag: string;
  title: string;
  lead: string;
}) {
  return (
    <section style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
      <div className="sh" style={{ marginBottom: 0 }}>
        <div className="tag">{tag}</div>
        <h1 className="display">{title}</h1>
        <p className="lead">{lead}</p>
        <div className="btn-row" style={{ justifyContent: 'center', marginTop: '2rem' }}>
          <Link className="btn btn-navy" href="/">Back to home</Link>
          <Link className="btn btn-outline" href="/contact">Get in touch</Link>
        </div>
      </div>
    </section>
  );
}
