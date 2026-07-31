import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppProviders from "@/components/providers/AppProviders";
import { auth } from "@/lib/auth";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VaultIQ AI",
  description: "Your intelligent financial companion",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="flex h-screen overflow-hidden bg-[#050505] text-foreground">
        <LanguageProvider>
          <ThemeProvider>
            <QueryProvider>
            <AuthSessionProvider>
              <LearningProgressProvider>
                {/* Icon-only slim sidebar — always visible globally */}
                <LeftNav activeItem="Dashboard" />
                {/* Main content fills the rest */}
                <main className="flex-1 h-full overflow-x-hidden overflow-y-auto">{children}</main>
                {/* Global AI Chat & API Keys — available on all pages */}
                <GlobalAIChat />
                <ApiKeysWidget />
                <ToastProvider />
              </LearningProgressProvider>
            </AuthSessionProvider>
            </QueryProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
