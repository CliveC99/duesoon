"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="auth-page"><div className="auth-container"><div className="brand auth-brand"><span className="brand-mark">DS</span><span>DueSoon</span></div><section className="auth-card not-found-card"><div className="auth-heading"><p>Something went wrong</p><h1>DueSoon couldn’t load this page</h1><span>Your data has not been changed. Try loading the page again.</span></div><div className="not-found-actions"><button className="add-button" type="button" onClick={reset}>Try again</button><a className="secondary-button" href="/dashboard">Go to dashboard</a></div></section></div></main>;
}
