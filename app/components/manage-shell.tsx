import Link from "next/link";
import type { User } from "next-auth";

import { signOut } from "@/auth";

function initials(user: User) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "Student";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ManageShell({ user, title, description, children }: { user: User; title: string; description: string; children: React.ReactNode }) {
  const displayName = user.name?.trim() || "Student";
  return (
    <div className="min-h-screen">
      <header className="site-header"><div className="shell flex h-16 items-center justify-between"><Link className="brand" href="/dashboard"><span className="brand-mark">DS</span><span>DueSoon</span></Link><nav className="manage-nav"><Link href="/dashboard">Dashboard</Link><Link href="/modules">Modules</Link><Link href="/semesters">Semesters</Link></nav><div className="account-area"><div className="account-copy"><strong>{displayName}</strong><form action={async () => { "use server"; await signOut({ redirectTo: "/sign-in" }); }}><button>Sign out</button></form></div><div className="avatar">{initials(user)}</div></div></div></header>
      <main className="shell manage-main"><div className="manage-heading"><div><p className="eyebrow">DueSoon</p><h1>{title}</h1><p className="intro">{description}</p></div></div>{children}</main>
    </div>
  );
}
