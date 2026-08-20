export const INSTALL_PROMPT_DISMISSED_KEY = "duesoon.install-prompt-dismissed";

export function isStandaloneDisplay(displayModeStandalone: boolean, navigatorStandalone?: boolean) {
  return displayModeStandalone || navigatorStandalone === true;
}

export function isAppleMobile(userAgent: string, maxTouchPoints = 0) {
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
}

export function isMobileDevice(userAgent: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

export function isSafariBrowser(userAgent: string) {
  return /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Android/i.test(userAgent);
}

export function shouldShowMobileInstallPrompt({ mobile, standalone, dismissed }: { mobile: boolean; standalone: boolean; dismissed: boolean }) {
  return mobile && !standalone && !dismissed;
}

export const IOS_INSTALL_STEPS = [
  "Open DueSoon in Safari.",
  "Tap the Share button.",
  'Choose "Add to Home Screen".',
  'Tap "Add".',
] as const;

export const ANDROID_INSTALL_STEPS = [
  "Open DueSoon in Chrome.",
  "Open the browser menu.",
  'Choose "Install app" or "Add to Home screen".',
  "Confirm installation.",
] as const;
