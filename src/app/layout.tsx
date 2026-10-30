import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Manrope } from "next/font/google";
import { headers } from "next/headers";
import { PostHogProvider } from "@/components/PostHogProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { requiresConsent } from "@/lib/consent";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

// Display face for headlines only (italic accents on marketing pages, page
// titles in the dashboard). Ships a single weight, so keep it to large sizes.
const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
});

const defaultUrl = process.env.NEXT_PUBLIC_APP_URL!;

export const viewport: Viewport = {
  themeColor: "#209CEE",
}

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  alternates: {
    canonical: '/',
  },
  title: {
    default: "VibeVaults - Visual Feedback Widget for Agency Websites",
    template: "%s | VibeVaults"
  },
  description: "Collect visual feedback directly on your clients' live websites with an embeddable feedback widget. Built for agencies and freelancers. 14-day free trial.",
  authors: [{ name: "VibeVaults Team" }],
  creator: "VibeVaults",
  publisher: "VibeVaults",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: defaultUrl,
    siteName: "VibeVaults",
    title: "VibeVaults - Visual Feedback Widget for Agency Websites",
    description: "Stop the endless email chains. Collect visual feedback directly on live websites and ship client sites faster with VibeVaults.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "VibeVaults - Visual Feedback Widget for Agency Websites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VibeVaults - Visual Feedback Widget for Agency Websites",
    description: "Stop the endless email chains. Collect visual feedback directly on live websites and ship client sites faster with VibeVaults.",
    images: ["/og-image.png"],
    creator: "@vibevaults",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const country = requestHeaders.get("x-vercel-ip-country");
  const requireConsent = requiresConsent(country);

  return (
    <html lang="en" className={`${manrope.variable} ${dmSerif.variable} font-sans`} suppressHydrationWarning>
      <body className={`${manrope.className} antialiased`}>
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <CookieConsent requireConsent={requireConsent} />
      </body>
    </html>
  );
}
