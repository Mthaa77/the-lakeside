import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { OrnamentDefs } from "@/components/lakeside/ornaments";
import { SITE } from "@/config/site";

/**
 * Type system (round 20 — editorial refresh):
 * - Display: Playfair Display. A high-contrast, elegant serif whose true
 *   italics carry the gold-gradient accent words across the site.
 * - Body: Outfit. A modern geometric sans — clean, warm, confident at both
 *   UI sizes and long-form copy. Tokens (--font-display / --font-body) are
 *   consumed everywhere via .font-display and .eyebrow, so the swap is global.
 */
const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const body = Outfit({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "The Lakeside | Glass Chapel Wedding Venue, Pretoria East",
    template: "%s | The Lakeside",
  },
  description:
    "A modern glass chapel, a marble reception on the water's edge and zebra grazing beyond your canapés. Family-run estate in Tiegerpoort, Pretoria East. Open pricing — see your estimate in under a minute.",
  keywords: [
    "wedding venue Pretoria East",
    "glass chapel wedding Pretoria",
    "weekday wedding Gauteng",
    "wedding venue with accommodation Pretoria",
    "wedding venue Tierpoort",
  ],
  icons: {
    icon: [
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/brand/icon-180.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    title: "The Lakeside — Where Glass Meets Lake",
    description:
      "A modern glass chapel, a marble reception on the water's edge, and zebra grazing just beyond your canapés. Pretoria East, South Africa.",
    url: SITE.url,
    siteName: "The Lakeside",
    type: "website",
    locale: "en_ZA",
    images: [
      {
        url: "/brand/og.jpg",
        width: 1200,
        height: 630,
        alt: "The Lakeside estate at dusk — the glass chapel and reception pavilion reflected in the lake",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Lakeside — Where Glass Meets Lake",
    description:
      "Glass chapel · marble reception on the water · wildlife on the lawns. Pretoria East.",
    images: ["/brand/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#10261E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-ZA" suppressHydrationWarning>
      <body
        className={`${display.variable} ${body.variable} antialiased bg-background text-foreground`}
      >
        {/* Shared SVG defs for every Rings / CircularSeal on the page —
            static ids, declared once, immune to hydration id shifts. */}
        <OrnamentDefs />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
