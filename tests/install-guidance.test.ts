import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { ANDROID_INSTALL_STEPS, INSTALL_PROMPT_DISMISSED_KEY, IOS_INSTALL_STEPS, isAppleMobile, isMobileDevice, isSafariBrowser, isStandaloneDisplay, shouldShowMobileInstallPrompt } from "../lib/install-guidance.ts";

test("standalone detection supports display-mode and the iOS navigator flag", () => {
  assert.equal(isStandaloneDisplay(true, false), true);
  assert.equal(isStandaloneDisplay(false, true), true);
  assert.equal(isStandaloneDisplay(false, false), false);
});

test("mobile prompt stays hidden after dismissal and when installed", () => {
  assert.equal(shouldShowMobileInstallPrompt({ mobile: true, standalone: false, dismissed: false }), true);
  assert.equal(shouldShowMobileInstallPrompt({ mobile: true, standalone: false, dismissed: true }), false);
  assert.equal(shouldShowMobileInstallPrompt({ mobile: true, standalone: true, dismissed: false }), false);
  assert.equal(shouldShowMobileInstallPrompt({ mobile: false, standalone: false, dismissed: false }), false);
  assert.equal(INSTALL_PROMPT_DISMISSED_KEY, "duesoon.install-prompt-dismissed");
});

test("Apple mobile detection includes iPhone and touch-based iPadOS", () => {
  assert.equal(isAppleMobile("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"), true);
  assert.equal(isAppleMobile("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 5), true);
  assert.equal(isAppleMobile("Mozilla/5.0 (Macintosh; Intel Mac OS X)", 0), false);
  assert.equal(isMobileDevice("Mozilla/5.0 (Linux; Android 15; Pixel 9) Mobile"), true);
});

test("iOS instructions describe Safari's real Add to Home Screen flow", () => {
  assert.deepEqual(IOS_INSTALL_STEPS, [
    "Open DueSoon in Safari.",
    "Tap the Share button.",
    'Choose "Add to Home Screen".',
    'Tap "Add".',
  ]);
  assert.equal(isSafariBrowser("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1"), true);
  assert.equal(isSafariBrowser("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/128.0 Mobile/15E148 Safari/604.1"), false);
});

test("Android instructions describe the Chrome installation flow", () => {
  assert.deepEqual(ANDROID_INSTALL_STEPS, [
    "Open DueSoon in Chrome.",
    "Open the browser menu.",
    'Choose "Install app" or "Add to Home screen".',
    "Confirm installation.",
  ]);
});

test("install component captures Chromium prompt events and installed state", async () => {
  const source = await readFile(new URL("../app/components/install-guidance.tsx", import.meta.url), "utf8");
  assert.match(source, /beforeinstallprompt/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /installEvent\.prompt\(\)/);
  assert.match(source, /installEvent\.userChoice/);
  assert.match(source, /appinstalled/);
  assert.match(source, /localStorage\.setItem\(INSTALL_PROMPT_DISMISSED_KEY/);
  assert.match(source, /aria-pressed=/);
  assert.match(source, /setSelectedDevice\("apple"\)/);
  assert.match(source, /setSelectedDevice\("android"\)/);
});
