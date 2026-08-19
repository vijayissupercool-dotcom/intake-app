import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://intake.app"
  ),
  title: {
    default: "Intake — Collect files directly into Google Drive",
    template: "%s | Intake",
  },
  description:
    "Collect files from anyone directly into your Google Drive. No account needed for uploaders.",
  icons: {
    icon: [
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Intake — Collect files into Google Drive",
    description:
      "Create secure file request links. Share them with anyone. Files land straight in your Google Drive folder.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Intake",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intake — Collect files into Google Drive",
    description:
      "Create secure file request links. Share them with anyone. Files land straight in your Google Drive folder.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
