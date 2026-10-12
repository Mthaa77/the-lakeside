/**
 * THE LAKESIDE — DEVICE-CONSENT STORAGE (client-only helpers)
 * Shared by ConsentNotice and the lower-screen surfaces. Kept out of the component file so
 * React Fast Refresh can hot-swap the notice without a full page reload
 * (a component file must only export components to stay refresh-safe).
 *
 * localStorage 'lakeside-consent' = 'device-only-v1'
 * CustomEvent 'lakeside:consent-changed' fires whenever the answer changes.
 */

export const CONSENT_KEY = 'lakeside-consent';
export const CONSENT_EVENT = 'lakeside:consent-changed';

export function readConsent(): string | null {
  try {
    return window.localStorage.getItem(CONSENT_KEY);
  } catch {
    return null; // storage unavailable → treat as unanswered, notice still works
  }
}

export function recordConsent() {
  try {
    window.localStorage.setItem(CONSENT_KEY, 'device-only-v1');
  } catch {
    /* storage unavailable — nothing to remember */
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT));
}
