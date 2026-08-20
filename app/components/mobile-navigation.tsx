"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { signOutUser } from "@/app/auth-actions";
import { SignOutButton } from "@/app/components/sign-out-button";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/exams", label: "Exams" },
  { href: "/timetable", label: "Timetable" },
  { href: "/modules", label: "Modules" },
  { href: "/semesters", label: "Semesters" },
  { href: "/groups", label: "Groups" },
  { href: "/profile", label: "Profile" },
];

export function MobileNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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

  const menu = open ? createPortal(
    <div className="mobile-navigation-layer">
      <button className="mobile-navigation-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setOpen(false)} />
      <div className="mobile-navigation-panel" id="mobile-navigation-panel">
        <nav aria-label="Mobile navigation">{navigation.map((item, index) => { const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`)); return <Link ref={index === 0 ? firstLinkRef : undefined} href={item.href} key={item.href} aria-current={active ? "page" : undefined} onClick={() => setOpen(false)}>{item.label}{active && <span>Current</span>}</Link>; })}<Link className="mobile-add-deadline" href="/deadlines/new" aria-current={pathname === "/deadlines/new" ? "page" : undefined} onClick={() => setOpen(false)}>Add Deadline</Link></nav>
        <form action={signOutUser}><SignOutButton /></form>
      </div>
    </div>,
    document.body,
  ) : null;

  return <div className="mobile-navigation"><button ref={triggerRef} type="button" className="mobile-menu-button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="mobile-navigation-panel" onClick={toggleMenu}><span /><span /><span /></button>{menu}</div>;
}
