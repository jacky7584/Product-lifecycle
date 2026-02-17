import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import CapacitorProvider from "@/components/CapacitorProvider";
import OfflineBanner from "@/components/OfflineBanner";
import PushSetup from "@/components/PushSetup";
import NavBar from "@/components/NavBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Product Tracker",
  description: "待辦事項追蹤系統",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body className={`${geistSans.variable} font-sans antialiased min-h-screen bg-bg-default text-text-primary transition-colors duration-200`}>
        <CapacitorProvider>
          <OfflineBanner />
          <ThemeProvider>
            <AuthProvider>
              <PushSetup />
              <NavBar />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
              </main>
            </AuthProvider>
          </ThemeProvider>
        </CapacitorProvider>
      </body>
    </html>
  );
}
