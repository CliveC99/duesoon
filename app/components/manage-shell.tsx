import Link from "next/link";
import type { User } from "next-auth";

import { signOutUser } from "@/app/auth-actions";
import { DesktopNavigation } from "@/app/components/desktop-navigation";
import { MobileNavigation } from "@/app/components/mobile-navigation";
import { SignOutButton } from "@/app/components/sign-out-button";
import { UserReminderCentre } from "@/app/components/user-reminder-centre";

function initials(user: User) {
  const source = user.name?.trim() || user.email?.split("@")[0] || "Student";
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ManageShell({ user, title, description, children }: { user: User; title: string; description: string; children: React.ReactNode }) {
  const displayName = user.name?.trim() || "Student";
  return (
    <div className="min-h-screen">
      <header className="site-header"><div className="shell flex h-16 items-center justify-between"><Link className="brand" href="/dashboard"><span className="brand-mark">DS</span><span>DueSoon</span></Link><DesktopNavigation /><div className="header-end"><UserReminderCentre /><div className="account-area desktop-account"><div className="account-copy"><Link href="/profile"><strong>{displayName}</strong></Link><form action={signOutUser}><SignOutButton /></form></div><Link className="avatar" href="/profile" aria-label="Open profile settings">{initials(user)}</Link></div><MobileNavigation /></div></div></header>
      <main className="shell manage-main"><div className="manage-heading"><div><p className="eyebrow">DueSoon</p><h1>{title}</h1><p className="intro">{description}</p></div></div>{children}</main>
    </div>
  );
}
