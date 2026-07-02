import type { Metadata } from "next";
import { ToastProvider } from "@/components/providers/toast-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";
import LearningProgressProvider from "@/components/providers/learning-progress-provider";
import LeftNav from "@/components/dashboard/LeftNav";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VaultIQ AI",
  description: "Your intelligent financial companion",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="flex h-screen overflow-hidden bg-[#050505] text-foreground">
        <ThemeProvider>
          <AuthSessionProvider>
            <LearningProgressProvider>
              {/* Icon-only slim sidebar — always visible globally */}
              <LeftNav activeItem="Dashboard" />
              {/* Main content fills the rest */}
              <main className="flex-1 overflow-hidden h-full">{children}</main>
              <ToastProvider />
            </LearningProgressProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

