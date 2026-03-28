import "./globals.css";

import { Poppins, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoadingProvider } from "@/components/providers/GlobalLoadingProvider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationLoader } from "@/components/ui/NavigationLoader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata = {
  title: "BLYLAB.",
  description: "",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};
export const dynamic = "force-dynamic";

import { BookmarkProvider } from "@/lib/context/BookmarkContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen">
        {/* Navigation Loading UX */}
        <NavigationLoader />

        {/* Wrap children with the ToastProvider */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <Toaster position="bottom-right" richColors />
          <GlobalLoadingProvider>
            <BookmarkProvider>
              {children}
            </BookmarkProvider>
          </GlobalLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
