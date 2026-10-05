import { useSyncExternalStore } from "react";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type InstallState = "installed" | "prompt" | "ios" | "unavailable";
let state: InstallState = "unavailable";
let pending: InstallPrompt | null = null;
let initialized = false;
let busy = false;
const subscribers = new Set<() => void>();
function emit() { subscribers.forEach((notify) => notify()); }
function standalone() {
  return typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (typeof navigator !== "undefined" && (navigator as Navigator & { standalone?: boolean }).standalone === true));
}
function receive(event: Event) {
  event.preventDefault();
  if (state === "installed" || standalone()) return;
  pending = event as InstallPrompt;
  state = "prompt";
  emit();
}
function installed() { pending = null; state = "installed"; emit(); }
export function initializeInstall() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  const ios = typeof navigator !== "undefined" && (/iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1));
  state = standalone() ? "installed" : ios ? "ios" : "unavailable";
  window.addEventListener("beforeinstallprompt", receive);
  window.addEventListener("appinstalled", installed);
  emit();
}
export async function requestInstall() {
  if (!pending || busy) return;
  const event = pending;
  pending = null;
  busy = true;
  emit();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") installed();
    else if (state !== "installed") state = pending ? "prompt" : "unavailable";
  } catch {
    if (state !== "installed") state = pending ? "prompt" : "unavailable";
  } finally { busy = false; emit(); }
}
const subscribe = (notify: () => void) => { subscribers.add(notify); return () => { subscribers.delete(notify); }; };
export function useInstall() {
  return {
    state: useSyncExternalStore(subscribe, () => state, () => "unavailable" as InstallState),
    busy: useSyncExternalStore(subscribe, () => busy, () => false)
  };
}
export function resetInstallForTests() {
  if (typeof window !== "undefined") {
    window.removeEventListener("beforeinstallprompt", receive);
    window.removeEventListener("appinstalled", installed);
  }
  initialized = false; pending = null; state = "unavailable"; busy = false;
  emit();
}
