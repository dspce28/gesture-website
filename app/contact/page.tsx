'use client';

import { useState } from 'react';
import { useReveal } from '@/components/Reveal';
import { Arrow } from '@/components/Ui';

const SERVICES = [
  'Custom Software Development', 'Web Development', 'Mobile App Development',
  'Cloud Solutions', 'AI & Automation', 'UI/UX Design', 'Cybersecurity',
  'IT Consulting', 'Other',
];

const BUDGETS = [
  'Under ₹50,000', '₹50,000 – ₹2,00,000', '₹2,00,000 – ₹10,00,000',
  '₹10,00,000+', 'Let us discuss',
];

const CONTACT = [
  { icon: '📧', t: 'Email Us', lines: ['logicubeit@gmail.com'] },
  { icon: '📞', t: 'Call Us', lines: ['+91 96010 50241', 'Mon–Sat, 9 AM – 7 PM IST'] },
  { icon: '📍', t: 'Visit Us', lines: ['LogiCube IT Pvt. Ltd.', 'Ahmedabad, Gujarat, India'] },
  { icon: '💬', t: 'WhatsApp', lines: ['+91 96010 50241', 'Fastest way to reach us'] },
];

const EMPTY = {
  first: '', last: '', email: '', phone: '',
  company: '', service: '', budget: '', message: '',
};

export default function Contact() {
  const page = useReveal<HTMLDivElement>();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof EMPTY) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first.trim() || !form.email.trim() || !form.message.trim()) {
      setError(true);
      return;
    }
    setError(false);

    // No backend is wired up yet, so hand the enquiry to the mail client
    // rather than pretending it was delivered.
    const body = [
      `Name: ${form.first} ${form.last}`,
      `Email: ${form.email}`,
      `Phone: ${form.phone}`,
      `Company: ${form.company}`,
      `Service: ${form.service}`,
      `Budget: ${form.budget}`,
      '',
      form.message,
    ].join('\n');

    window.location.href =
      `mailto:logicubeit@gmail.com?subject=${encodeURIComponent(
        `Project enquiry from ${form.first} ${form.last}`.trim()
      )}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div ref={page}>
      <div className="inner-hero" style={{ textAlign: 'left' }}>
        <div className="inner-hero-inner" style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'left' }}>
          <div className="tag rev">Let us Talk</div>
          <h1 className="display rev d1">
            Start a <span className="italic">conversation</span>
          </h1>
          <p className="lead rev d2" style={{ marginTop: '.8rem', maxWidth: 500 }}>
            Whether you have a project in mind, a question, or want to say hello
            — we would love to hear from you.
          </p>
        </div>
      </div>

      <section style={{ background: 'var(--bg)' }}>
        <div className="contact-wrap">
          <div className="rev-l">
            {CONTACT.map((c) => (
              <div className="ci-item" key={c.t}>
                <div className="ci-icon">{c.icon}</div>
                <div>
                  <h4>{c.t}</h4>
                  <p>
                    {c.lines.map((l, i) => (
                      <span key={l}>
                        {i > 0 && <br />}
                        {l}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            ))}

            <div className="response-note">
              <h4>⚡ Typical Response Time</h4>
              <p>
                We respond to all inquiries within{' '}
                <strong>4 business hours.</strong> For urgent projects, WhatsApp
                is fastest.
              </p>
            </div>
          </div>

          <form className="contact-form-wrap rev-r" onSubmit={submit} noValidate>
            <h3 className="cfw-title">Send a message</h3>
            <p className="cfw-sub">
              Fill in the form and our team will get back to you within 4 hours.
            </p>

            <div className="form-row">
              <div className="fg">
                <label htmlFor="cf-first">First Name</label>
                <input id="cf-first" type="text" placeholder="John" value={form.first} onChange={set('first')} required />
              </div>
              <div className="fg">
                <label htmlFor="cf-last">Last Name</label>
                <input id="cf-last" type="text" placeholder="Doe" value={form.last} onChange={set('last')} />
              </div>
            </div>

            <div className="form-row">
              <div className="fg">
                <label htmlFor="cf-email">Email</label>
                <input id="cf-email" type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} required />
              </div>
              <div className="fg">
                <label htmlFor="cf-phone">Phone</label>
                <input id="cf-phone" type="tel" placeholder="+91 96010 50241" value={form.phone} onChange={set('phone')} />
              </div>
            </div>

            <div className="fg">
              <label htmlFor="cf-company">Company</label>
              <input id="cf-company" type="text" placeholder="Your Company Name" value={form.company} onChange={set('company')} />
            </div>

            <div className="fg">
              <label htmlFor="cf-service">Service Required</label>
              <select id="cf-service" value={form.service} onChange={set('service')}>
                <option value="">Select a service...</option>
                {SERVICES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div className="fg">
              <label htmlFor="cf-budget">Budget Range</label>
              <select id="cf-budget" value={form.budget} onChange={set('budget')}>
                <option value="">Select budget range...</option>
                {BUDGETS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>

            <div className="fg">
              <label htmlFor="cf-message">Project Details</label>
              <textarea
                id="cf-message"
                placeholder="Tell us about your project, goals, timeline, and requirements..."
                value={form.message}
                onChange={set('message')}
                required
              />
            </div>

            {error && (
              <p className="cf-error" role="alert">
                Please fill in your name, email, and project details.
              </p>
            )}
            {sent && !error && (
              <p className="cf-sent" role="status">
                Opening your email client — send the message to reach us.
              </p>
            )}

            <button className="btn btn-navy cf-submit" type="submit">
              Send Message <Arrow />
            </button>

            <p className="cf-note">
              🔒 100% confidential. We never share your information.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
