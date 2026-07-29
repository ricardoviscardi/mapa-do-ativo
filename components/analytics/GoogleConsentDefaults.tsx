import Script from "next/script";

/**
 * Define o consentimento como negado antes de qualquer comando de medição.
 * A tag do Google só é carregada pelo componente GoogleAnalytics depois que
 * o visitante aceita cookies analíticos.
 */
export function GoogleConsentDefaults() {
  return (
    <Script id="google-consent-defaults" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
      `}
    </Script>
  );
}
