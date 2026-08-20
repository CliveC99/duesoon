"use client";

import { useEffect, useState } from "react";

import { ANDROID_INSTALL_STEPS, INSTALL_PROMPT_DISMISSED_KEY, IOS_INSTALL_STEPS, isAppleMobile, isMobileDevice, isSafariBrowser, isStandaloneDisplay, shouldShowMobileInstallPrompt } from "@/lib/install-guidance";

type InstallChoice = { outcome: "accepted" | "dismissed"; platform: string };
type BeforeInstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<InstallChoice> };
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

type InstallState = {
  ready: boolean;
  installed: boolean;
  mobile: boolean;
  appleMobile: boolean;
  safari: boolean;
  dismissed: boolean;
};

const initialState: InstallState = { ready: false, installed: false, mobile: false, appleMobile: false, safari: false, dismissed: false };

export function InstallGuidance({ placement }: { placement: "profile" | "dashboard" }) {
  const [state, setState] = useState(initialState);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(placement === "profile");
  const [selectedDevice, setSelectedDevice] = useState<"apple" | "android">("android");

  useEffect(() => {
    const displayQuery = window.matchMedia("(display-mode: standalone)");
    const installed = isStandaloneDisplay(displayQuery.matches, (navigator as NavigatorWithStandalone).standalone);
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setState({
        ready: true,
        installed,
        mobile: isMobileDevice(navigator.userAgent),
        appleMobile: isAppleMobile(navigator.userAgent, navigator.maxTouchPoints),
        safari: isSafariBrowser(navigator.userAgent),
        dismissed: localStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY) === "true",
      });
      if (isAppleMobile(navigator.userAgent, navigator.maxTouchPoints)) setSelectedDevice("apple");
    });

    function captureInstallEvent(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }
    function markInstalled() {
      setInstallEvent(null);
      setState((current) => ({ ...current, installed: true }));
    }
    function syncDisplayMode(event: MediaQueryListEvent) {
      if (event.matches) markInstalled();
    }

    window.addEventListener("beforeinstallprompt", captureInstallEvent);
    window.addEventListener("appinstalled", markInstalled);
    displayQuery.addEventListener("change", syncDisplayMode);
    return () => {
      active = false;
      window.removeEventListener("beforeinstallprompt", captureInstallEvent);
      window.removeEventListener("appinstalled", markInstalled);
      displayQuery.removeEventListener("change", syncDisplayMode);
    };
  }, []);

  function dismiss() {
    localStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, "true");
    setState((current) => ({ ...current, dismissed: true }));
  }

  async function install() {
    if (!installEvent) {
      setShowInstructions(true);
      return;
    }
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    setInstallEvent(null);
    if (choice.outcome === "accepted") setState((current) => ({ ...current, installed: true }));
    if (placement === "dashboard") dismiss();
  }

  if (!state.ready) return placement === "profile" ? <p className="install-status" aria-live="polite">Checking installation options…</p> : null;
  if (placement === "dashboard" && !shouldShowMobileInstallPrompt({ mobile: state.mobile, standalone: state.installed, dismissed: state.dismissed })) return null;

  if (placement === "profile" && state.installed) {
    return <div className="install-status install-status-installed"><strong>DueSoon is installed on this device</strong><p>You’re using DueSoon with an app-style experience.</p></div>;
  }

  const buttonLabel = installEvent ? "Install DueSoon" : "Show me how";
  const instructionsId = `install-instructions-${placement}`;
  return <div className={placement === "dashboard" ? "install-banner" : "install-profile-control"}>
    {placement === "dashboard" && <div className="install-banner-copy"><strong>Get the DueSoon app</strong><p>Add DueSoon to your Home Screen for quick access.</p></div>}
    <div className="install-actions">
      <button className="install-primary" type="button" onClick={install} aria-expanded={!installEvent ? showInstructions : undefined} aria-controls={!installEvent ? instructionsId : undefined}>{buttonLabel}</button>
      {placement === "dashboard" && <button className="install-dismiss" type="button" onClick={dismiss} aria-label="Dismiss DueSoon install suggestion">Not now</button>}
    </div>
    {showInstructions && <section className="install-instructions" id={instructionsId} aria-live="polite">
      <h3>Choose your device:</h3>
      <div className="install-device-selector" role="group" aria-label="Choose installation device">
        <button type="button" aria-pressed={selectedDevice === "apple"} onClick={() => setSelectedDevice("apple")}><span aria-hidden="true">{selectedDevice === "apple" ? "✓" : ""}</span>Apple</button>
        <button type="button" aria-pressed={selectedDevice === "android"} onClick={() => setSelectedDevice("android")}><span aria-hidden="true">{selectedDevice === "android" ? "✓" : ""}</span>Android</button>
      </div>
      <div className="install-device-instructions">
        <h4>{selectedDevice === "apple" ? "iPhone / iPad" : "Android"}</h4>
        {selectedDevice === "apple" && state.appleMobile && !state.safari && <p className="install-browser-note">You’re not currently using Safari. Open DueSoon in Safari for the normal installation flow.</p>}
        <ol>{(selectedDevice === "apple" ? IOS_INSTALL_STEPS : ANDROID_INSTALL_STEPS).map((step) => <li key={step}>{step}</li>)}</ol>
      </div>
    </section>}
  </div>;
}
