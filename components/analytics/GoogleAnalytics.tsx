"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  type AnalyticsConsent
} from "@/components/privacy/consent";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

type ConsentEvent = CustomEvent<AnalyticsConsent>;

function getAnalyticsWindow() {
  return window as AnalyticsWindow;
}

function ensureGtag() {
  const analyticsWindow = getAnalyticsWindow();
  analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  analyticsWindow.gtag =
    analyticsWindow.gtag ||
    ((...args: unknown[]) => {
      analyticsWindow.dataLayer?.push(args);
    });

  return analyticsWindow.gtag;
}

function readStoredConsent(): AnalyticsConsent | null {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function removeGoogleAnalyticsCookies() {
  const hostname = window.location.hostname;
  const parentDomain = hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  const domains = [hostname, `.${hostname}`, parentDomain, `.${parentDomain}`];

  document.cookie.split(";").forEach((cookie) => {
    const cookieName = cookie.split("=")[0]?.trim();
    if (!cookieName?.startsWith("_ga")) return;

    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
    domains.forEach((domain) => {
      document.cookie = `${cookieName}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    });
  });
}

export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setConsent(readStoredConsent());

    const handleConsent = (event: Event) => {
      setConsent((event as ConsentEvent).detail);
    };

    window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsent);
  }, []);

  useEffect(() => {
    if (!measurementId) return;

    const gtag = ensureGtag();

    if (consent !== "granted") {
      gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied"
      });
      setInitialized(false);

      if (consent === "denied") {
        removeGoogleAnalyticsCookies();
      }
      return;
    }

    gtag("consent", "update", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    });

    if (!document.getElementById("google-analytics-script")) {
      const script = document.createElement("script");
      script.id = "google-analytics-script";
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }

    gtag("js", new Date());
    gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    setInitialized(true);
  }, [consent, measurementId]);

  useEffect(() => {
    if (!measurementId || consent !== "granted" || !initialized) return;

    const timer = window.setTimeout(() => {
      const gtag = ensureGtag();
      gtag("event", "page_view", {
        page_title: document.title,
        page_location: window.location.href,
        page_path: `${window.location.pathname}${window.location.search}`
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [consent, initialized, measurementId, pathname]);

  return null;
}
