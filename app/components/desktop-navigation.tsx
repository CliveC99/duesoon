"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/timetable", label: "Timetable" },
  { href: "/modules", label: "Modules" },
  { href: "/semesters", label: "Semesters" },
  { href: "/groups", label: "Groups" },
  { href: "/profile", label: "Profile" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(`${href}/`));
}

export function DesktopNavigation() {
  const pathname = usePathname();
  return <nav className="manage-nav" aria-label="Primary navigation">{navigation.map((item) => <Link href={item.href} key={item.href} aria-current={isActive(pathname, item.href) ? "page" : undefined}>{item.label}</Link>)}<Link className="manage-nav-add" href="/deadlines/new" aria-current={pathname === "/deadlines/new" ? "page" : undefined}>Add Deadline</Link></nav>;
}
