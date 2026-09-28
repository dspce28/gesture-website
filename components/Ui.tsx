import Link from 'next/link';

/** The arrow that trails every primary call to action on the site. */
export function Arrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

/** Navy band that closes most pages. */
export function CtaBand({
  title,
  lead,
  cta = 'Start a Project',
  href = '/contact',
}: {
  title: React.ReactNode;
  lead: string;
  cta?: string;
  href?: string;
}) {
  return (
    <div className="cta-band">
      <h2 className="display rev" style={{ color: 'var(--white)' }}>{title}</h2>
      <p className="lead rev d1">{lead}</p>
      <div className="cta-btn-row rev d2">
        <Link className="btn btn-gold" href={href}>
          {cta} <Arrow />
        </Link>
      </div>
    </div>
  );
}

/** Section heading: tag, display title, optional lead. */
export function SectionHead({
  tag,
  gold,
  title,
  lead,
}: {
  tag: string;
  gold?: boolean;
  title: React.ReactNode;
  lead?: string;
}) {
  return (
    <div className="sh rev">
      <div className={gold ? 'tag tag-gold' : 'tag'}>{tag}</div>
      <h2 className="display">{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

/** Tall hero used by the inner pages. */
export function PageHero({
  tag,
  title,
  lead,
  cta,
  href = '/contact',
  aside,
}: {
  tag: string;
  title: React.ReactNode;
  lead: string;
  cta?: string;
  href?: string;
  aside?: React.ReactNode;
}) {
  return (
    <div className="about-hero">
      <div className="about-hero-mesh" />
      <div className="about-hero-inner">
        <div className="rev-l">
          <div className="tag">{tag}</div>
          <h1 className="display" style={{ marginBottom: '1.3rem' }}>{title}</h1>
          <p className="lead">{lead}</p>
          {cta && (
            <div className="btn-row" style={{ marginTop: '2rem' }}>
              <Link className="btn btn-navy" href={href}>
                {cta} <Arrow />
              </Link>
            </div>
          )}
        </div>
        {aside && <div className="rev-r">{aside}</div>}
      </div>
    </div>
  );
}

/** Small stat tile, as used on the About hero. */
export function StatTile({
  value,
  label,
  bg,
  fg = 'var(--navy)',
  labelFg = 'var(--muted)',
  border,
}: {
  value: string;
  label: string;
  bg: string;
  fg?: string;
  labelFg?: string;
  border?: boolean;
}) {
  return (
    <div
      style={{
        background: bg,
        border: border ? '1px solid var(--border)' : undefined,
        borderRadius: 'var(--r-lg)',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: 'var(--font-dm-serif), serif', fontSize: '3rem', color: fg }}>
        {value}
      </div>
      <div style={{ fontSize: '.82rem', color: labelFg, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

/** Compact hero used by the inner pages (services, solutions, portfolio…). */
export function InnerHero({
  tag,
  title,
  lead,
}: {
  tag: string;
  title: React.ReactNode;
  lead: string;
}) {
  return (
    <div className="inner-hero">
      <div className="inner-hero-inner">
        <div className="tag rev">{tag}</div>
        <h1 className="display rev d1">{title}</h1>
        <p className="lead rev d2" style={{ marginTop: '.8rem' }}>{lead}</p>
      </div>
    </div>
  );
}
