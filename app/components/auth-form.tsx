"use client";

import { useActionState } from "react";

import { authenticate, register, type AuthActionState } from "@/app/auth-actions";

const initialState: AuthActionState = {};

export function SignInForm() {
  const [state, action, pending] = useActionState(authenticate, initialState);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@university.edu" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" minLength={8} maxLength={72} required />
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      <button className="auth-submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(register, initialState);

  return (
    <form action={action} className="auth-form">
      <label htmlFor="name">Full name</label>
      <input id="name" name="name" type="text" autoComplete="name" placeholder="Alex Morgan" minLength={2} maxLength={80} required />
      <label htmlFor="email">Email address</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@university.edu" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} maxLength={72} required />
      <label htmlFor="confirmPassword">Confirm password</label>
      <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" minLength={8} maxLength={72} required />
      {state.error && <p className="auth-error" role="alert">{state.error}</p>}
      <button className="auth-submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}</button>
    </form>
  );
}
