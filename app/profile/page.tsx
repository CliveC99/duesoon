import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ManageShell } from "@/app/components/manage-shell";
import { InstallGuidance } from "@/app/components/install-guidance";
import { ChangePasswordForm, ProfileEmailForm, ProfileNameForm } from "@/app/components/profile-forms";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const userId = await requireUserId();
  const [session, user] = await Promise.all([auth(), prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } })]);
  if (!user) notFound();
  const currentUser = { ...session!.user!, id: userId, name: user.name, email: user.email };
  return <ManageShell user={currentUser} title="Profile and security" description="Manage the identity, password, and app experience used for your DueSoon account."><div className="profile-sections"><section className="profile-section"><div className="profile-section-copy"><p className="eyebrow">Profile details</p><h2>Your name</h2><p>Keep the name shown in your dashboard and private groups up to date.</p></div><ProfileNameForm initialName={user.name ?? ""} /></section><section className="profile-section"><div className="profile-section-copy"><p className="eyebrow">Email</p><h2>Sign-in address</h2><p>Email verification is not enabled, so a new address becomes active immediately.</p></div><ProfileEmailForm initialEmail={user.email} /></section><section className="profile-section"><div className="profile-section-copy"><p className="eyebrow">Install</p><h2>Install DueSoon</h2><p>Add DueSoon to your Home Screen for faster access and an app-style experience. Installing also enables app-style features such as notifications when supported.</p></div><InstallGuidance placement="profile" /></section><section className="profile-section"><div className="profile-section-copy"><p className="eyebrow">Security</p><h2>Change password</h2><p>Your current password is required. Existing signed-in sessions remain active.</p></div><ChangePasswordForm /></section></div></ManageShell>;
}
