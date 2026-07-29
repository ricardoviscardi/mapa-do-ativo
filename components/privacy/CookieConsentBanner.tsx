"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  OPEN_COOKIE_PREFERENCES_EVENT,
  type AnalyticsConsent
} from "@/components/privacy/consent";

function readStoredConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentConsent, setCurrentConsent] = useState<AnalyticsConsent | null>(null);

  useEffect(() => {
    const storedConsent = readStoredConsent();
    setCurrentConsent(storedConsent);
    setIsOpen(storedConsent === null);

    const openPreferences = () => setIsOpen(true);
    window.addEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(OPEN_COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  function saveConsent(consent: AnalyticsConsent) {
    try {
      window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent);
    } catch {
      // O site continua funcionando mesmo se o navegador bloquear o armazenamento local.
    }

    setCurrentConsent(consent);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_EVENT, { detail: consent })
    );
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[100] p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="container-page rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p id="cookie-consent-title" className="text-base font-bold text-[var(--color-text)]">
              Sua privacidade no Mapa do Ativo
            </p>
            <p
              id="cookie-consent-description"
              className="mt-2 max-w-3xl text-sm leading-6 text-[var(--color-muted)]"
            >
              Usamos recursos essenciais para o site funcionar. Com sua autorização, também usamos o
              Google Analytics para entender, de forma agregada, como as páginas são utilizadas e melhorar
              a experiência. Cookies analíticos permanecem desativados até você aceitar.
            </p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Você pode mudar sua escolha depois em{" "}
              <Link className="font-semibold text-[var(--color-primary)] underline" href="/privacidade">
                Política de Privacidade
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
            <button
              type="button"
              onClick={() => saveConsent("denied")}
              className="focus-ring rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-background-alt)]"
            >
              Recusar analíticos
            </button>
            <button
              type="button"
              onClick={() => saveConsent("granted")}
              className="focus-ring rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Aceitar analíticos
            </button>
          </div>
        </div>

        {currentConsent !== null ? (
          <p className="mt-3 text-xs text-[var(--color-muted)]">
            Escolha atual: {currentConsent === "granted" ? "cookies analíticos aceitos" : "cookies analíticos recusados"}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
