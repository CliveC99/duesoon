import Link from "next/link";

export function AuthShell({
  children,
  title,
  description,
  alternateText,
  alternateLabel,
  alternateHref,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  alternateText: string;
  alternateLabel: string;
  alternateHref: string;
}) {
  return (
    <main className="auth-page">
      <div className="auth-container">
        <Link className="brand auth-brand" href="/" aria-label="DueSoon home">
          <span className="brand-mark"><svg aria-hidden="true" className="size-[18px]" fill="none" viewBox="0 0 20 20" stroke="currentColor" strokeWidth="1.7"><circle cx="10" cy="10" r="8" /><path d="M10 6v4l3 2" /></svg></span>
          <span>DueSoon</span>
        </Link>
        <section className="auth-card">
          <div className="auth-heading"><p>Welcome to DueSoon</p><h1>{title}</h1><span>{description}</span></div>
          {children}
          <p className="auth-alternate">{alternateText} <Link href={alternateHref}>{alternateLabel}</Link></p>
        </section>
        <p className="auth-note">One place for every deadline.</p>
      </div>
    </main>
  );
}
