import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { PixelRouteTracker } from "@/components/PixelRouteTracker";

import { CartProvider } from "@/context/CartContext";
import { ModalProvider } from "@/context/ModalContext";
import CartDrawer from "@/components/CartDrawer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://digitalcorebd.com"),
  title: "Digitalcorebd.com - Premium Digital Hub",
  description: "Premium Digital Accounts, Workspace Slots & Software Subscriptions",
  keywords: ["Digitalcorebd", "digital accounts", "canva pro", "netflix", "cursor pro", "chatgpt plus", "Bangladesh digital store"],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Digitalcorebd.com - Premium Digital Hub",
    description: "Premium Digital Accounts, Workspace Slots & Software Subscriptions with instant automated delivery.",
    siteName: "Digitalcorebd",
    locale: "bn_BD",
    type: "website",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Digitalcorebd.com",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  let pixelId = "";

  try {
    const res = await fetch(`${apiUrl}/api/settings/public`, {
      next: { revalidate: 10 }, // check for updates every 10 seconds
    });
    if (res.ok) {
      const data = await res.json();
      pixelId = data.pixelId;
    }
  } catch {
    // API server not reachable at build time; fallback gracefully
  }

  // Fallback to Env if DB fails or is empty
  if (!pixelId) {
    pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  }

  return (
    <html lang="bn" data-theme="kalobazar" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {pixelId && (
          <>
            <Script id="meta-pixel-base" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        <PixelRouteTracker />
        <ModalProvider>
          <CartProvider>
            {children}
            <CartDrawer />
          </CartProvider>
        </ModalProvider>
      </body>
    </html>
  );
}
