import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Page Not Found" };

export default function NotFound() {
  return <main className="auth-page"><div className="auth-container"><Link className="brand auth-brand" href="/dashboard"><span className="brand-mark">DS</span><span>DueSoon</span></Link><section className="auth-card not-found-card"><div className="auth-heading"><p>Page not found</p><h1>We couldn’t find that</h1><span>The link may be invalid, or the item may have been deleted or may not belong to your account.</span></div><div className="not-found-actions"><Link className="add-button" href="/dashboard">Go to dashboard</Link><Link className="secondary-button" href="/groups">View groups</Link></div></section></div></main>;
}
