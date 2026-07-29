"use client";

import { OPEN_COOKIE_PREFERENCES_EVENT } from "@/components/privacy/consent";

export function CookiePreferencesButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_PREFERENCES_EVENT))}
    >
      Preferências de cookies
    </button>
  );
}
