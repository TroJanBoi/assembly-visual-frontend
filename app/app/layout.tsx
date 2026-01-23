import "./globals.css";

import { Poppins, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { GlobalLoadingProvider } from "@/components/providers/GlobalLoadingProvider";

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${poppins.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen">
        {/* Wrap children with the ToastProvider */}
        <Toaster position="bottom-right" richColors />
        <GlobalLoadingProvider>
          {children}
        </GlobalLoadingProvider>
      </body>
    </html>
  );
}
