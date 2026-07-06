import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { PixelRouteTracker } from "@/components/PixelRouteTracker";

export const metadata: Metadata = {
  title: "Lumina Digital Storefront",
  description: "Premium Digital Products & Courses Guest Purchase Storefront",
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
  } catch (error) {
    console.error("Failed to load public settings for Meta Pixel ID:", error);
  }

  // Fallback to Env if DB fails or is empty
  if (!pixelId) {
    pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
  }

  return (
    <html lang="bn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
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
                fbq('track', 'PageView');
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
        {children}
      </body>
    </html>
  );
}
