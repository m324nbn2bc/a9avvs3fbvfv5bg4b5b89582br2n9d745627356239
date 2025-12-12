import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import ClientAuthProvider from "../components/ClientAuthProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import TimeoutWrapper from "../components/TimeoutWrapper";
import AuthenticatedLayout from "../components/AuthenticatedLayout";
import AuthGate from "../components/AuthGate";
import { CampaignSessionProvider } from "../contexts/CampaignSessionContext";
import NotificationProvider from "../components/notifications/NotificationProvider";
import Analytics from "./analytics";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Frame Your Voice - Twibbonize App",
  description: "Create and share frames that amplify your message, celebrate your cause, and inspire others to join in.",
};

export default function RootLayout({ children }) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        <ErrorBoundary>
          <TimeoutWrapper timeout={15000}>
            <ClientAuthProvider>
              <NotificationProvider>
                <CampaignSessionProvider>
                  <AuthenticatedLayout>
                    <AuthGate>
                      {children}
                    </AuthGate>
                  </AuthenticatedLayout>
                </CampaignSessionProvider>
              </NotificationProvider>
            </ClientAuthProvider>
          </TimeoutWrapper>
        </ErrorBoundary>
        {gaId && (
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        )}
      </body>
    </html>
  );
}
