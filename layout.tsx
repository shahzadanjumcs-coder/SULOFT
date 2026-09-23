import type { Metadata } from "next";
import { Geist, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth-context";
import { SetupBanner } from "@/components/suloft/shared/SetupBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const displayFont = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "SULOFT — Superior University Okara Lost & Found Portal",
  description:
    "Lost something? Find it. Found something? Help return it. SULOFT is the official Lost & Found portal for Superior University Okara — report, search, claim, and safely return belongings on campus.",
  keywords: [
    "SULOFT",
    "Superior University Okara",
    "Lost and Found",
    "University Portal",
    "Student Services",
  ],
  authors: [{ name: "Shahzad Anjum" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "SULOFT — Superior University Okara Lost & Found Portal",
    description:
      "Report lost items, found items, and safely return belongings on the Superior University Okara campus.",
    siteName: "SULOFT",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${displayFont.variable} font-sans antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <SetupBanner />
          {children}
          <Toaster />
          <SonnerToaster position="top-right" richColors closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
