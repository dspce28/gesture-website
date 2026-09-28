import Image from 'next/image';
import Link from 'next/link';

const COMPANY = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/blog', label: 'Blog' },
  { href: '/careers', label: 'Careers' },
];

const SERVICES = [
  'Custom Software',
  'Web Development',
  'Mobile Apps',
  'Cloud & DevOps',
  'AI & Automation',
];

const SOCIAL = ['in', '𝕏', 'f', 'ig'];

export function SiteFooter() {
  return (
    <footer>
      <div className="foot-accent" />
      <div style={{ height: 64 }} />

      <div className="foot-top">
        <div className="foot-brand">
          <Image
            src="/images/cropped-Final-Logicube-3.png"
            alt="LogiCube IT"
            width={150}
            height={40}
          />
          <p>
            Premium IT solutions for forward-thinking businesses. Your trusted
            technology partner for the digital age.
          </p>
          <div className="foot-social">
            {SOCIAL.map((s) => (
              <a className="fsb" href="#" key={s} aria-label={s}>
                {s}
              </a>
            ))}
          </div>
        </div>

        <div className="foot-col">
          <h4>Company</h4>
          <ul>
            {COMPANY.map((c) => (
              <li key={c.href}>
                <Link href={c.href}>{c.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="foot-col">
          <h4>Services</h4>
          <ul>
            {SERVICES.map((s) => (
              <li key={s}>
                <Link href="/services">{s}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="foot-col">
          <h4>Contact</h4>
          <ul>
            <li>
              <a href="mailto:logicubeit@gmail.com">logicubeit@gmail.com</a>
            </li>
            <li>
              <a href="tel:+919601050241">+91 96010 50241</a>
            </li>
            <li>
              <a>Ahmedabad, Gujarat</a>
            </li>
            <li>
              <a>Mon–Sat 9AM–7PM IST</a>
            </li>
          </ul>
        </div>
      </div>

      <div className="foot-bottom">
        <p>© 2025 LogiCube IT Pvt. Ltd. All rights reserved.</p>
        <p>Privacy Policy · Terms · Cookies</p>
      </div>
    </footer>
  );
}
