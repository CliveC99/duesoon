"use client";

import { useActionState } from "react";

import { changePassword, updateProfileEmail, updateProfileName, type ProfileActionState } from "@/app/profile-actions";

const initialState: ProfileActionState = {};

function Feedback({ state }: { state: ProfileActionState }) {
  return <>{state.error && <p className="auth-error" role="alert">{state.error}</p>}{state.success && <p className="form-success" role="status">{state.success}</p>}</>;
}

export function ProfileNameForm({ initialName }: { initialName: string }) {
  const [state, action, pending] = useActionState(updateProfileName, initialState);
  const error = state.fieldErrors?.name?.[0];
  return <form action={action} className="profile-form" noValidate><label htmlFor="profile-name">Display name</label><input id="profile-name" name="name" defaultValue={state.values?.name ?? initialName} autoComplete="name" minLength={2} maxLength={80} required aria-invalid={error ? true : undefined} aria-describedby={error ? "profile-name-error" : "profile-name-help"} /><p className="form-helper" id="profile-name-help">Used in your greeting, account header and group membership.</p>{error && <p className="field-error" id="profile-name-error" role="alert">{error}</p>}<Feedback state={state} /><button className="auth-submit" disabled={pending}>{pending ? "Saving…" : "Save name"}</button></form>;
}

export function ProfileEmailForm({ initialEmail }: { initialEmail: string }) {
  const [state, action, pending] = useActionState(updateProfileEmail, initialState);
  const error = state.fieldErrors?.email?.[0];
  return <form action={action} className="profile-form" noValidate><label htmlFor="profile-email">Email address</label><input id="profile-email" name="email" type="email" defaultValue={state.values?.email ?? initialEmail} autoComplete="email" placeholder="you@example.com" required aria-invalid={error ? true : undefined} aria-describedby={`profile-email-help${error ? " profile-email-error" : ""}`} /><p className="form-helper" id="profile-email-help">Changes take effect immediately. Use the new address the next time you sign in.</p>{error && <p className="field-error" id="profile-email-error" role="alert">{error}</p>}<Feedback state={state} /><button className="auth-submit" disabled={pending}>{pending ? "Saving…" : "Save email"}</button></form>;
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, initialState);
  const currentError = state.fieldErrors?.currentPassword?.[0];
  const newError = state.fieldErrors?.newPassword?.[0];
  const confirmError = state.fieldErrors?.confirmPassword?.[0];
  const resetKey = state.success ? "changed" : "editing";
  return <form action={action} className="profile-form" noValidate><label htmlFor="current-password">Current password</label><input key={`${resetKey}-current`} id="current-password" name="currentPassword" type="password" autoComplete="current-password" required aria-invalid={currentError ? true : undefined} aria-describedby={currentError ? "current-password-error" : undefined} />{currentError && <p className="field-error" id="current-password-error" role="alert">{currentError}</p>}<label htmlFor="new-password">New password</label><input key={`${resetKey}-new`} id="new-password" name="newPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required aria-invalid={newError ? true : undefined} aria-describedby={`new-password-help${newError ? " new-password-error" : ""}`} /><p className="form-helper" id="new-password-help">Use 8–72 characters and choose a password you have not used for this account.</p>{newError && <p className="field-error" id="new-password-error" role="alert">{newError}</p>}<label htmlFor="confirm-new-password">Confirm new password</label><input key={`${resetKey}-confirm`} id="confirm-new-password" name="confirmPassword" type="password" autoComplete="new-password" minLength={8} maxLength={72} required aria-invalid={confirmError ? true : undefined} aria-describedby={confirmError ? "confirm-new-password-error" : undefined} />{confirmError && <p className="field-error" id="confirm-new-password-error" role="alert">{confirmError}</p>}<Feedback state={state} /><button className="auth-submit" disabled={pending}>{pending ? "Changing…" : "Change password"}</button></form>;
}
