"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { signOutUser } from "@/app/auth-actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/modules", label: "Modules" },
  { href: "/semesters", label: "Semesters" },
  { href: "/groups", label: "Groups" },
  { href: "/profile", label: "Profile" },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
      requestAnimationFrame(() => triggerRef.current?.focus());
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function toggleMenu() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    requestAnimationFrame(() => firstLinkRef.current?.focus());
  }

  return <div className="mobile-navigation" ref={containerRef} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}><button ref={triggerRef} type="button" className="mobile-menu-button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="mobile-navigation-panel" onClick={toggleMenu}><span /><span /><span /></button>{open && <div className="mobile-navigation-panel" id="mobile-navigation-panel"><nav aria-label="Mobile navigation">{navigation.map((item, index) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)); return <Link ref={index === 0 ? firstLinkRef : undefined} href={item.href} key={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}{active && <span>Current</span>}</Link>; })}<Link className="mobile-add-deadline" href="/deadlines/new" onClick={() => setOpen(false)}>Add Deadline</Link></nav><form action={signOutUser}><button type="submit">Sign out</button></form></div>}</div>;
}
