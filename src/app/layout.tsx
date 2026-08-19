import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Intake",
  description:
    "Collect files from anyone directly into your Google Drive. No account needed for uploaders.",
  icons: {
    icon: "/intake_logo_only.png",
    apple: "/intake_logo_only.png",
  },
  openGraph: {
    title: "Intake — Collect files into Google Drive",
    description:
      "Create secure file request links. Share them with anyone. Files land straight in your Google Drive folder.",
    images: ["/intake_logowithname.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Intake — Collect files into Google Drive",
    description:
      "Create secure file request links. Share them with anyone. Files land straight in your Google Drive folder.",
    images: ["/intake_logowithname.png"],
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
