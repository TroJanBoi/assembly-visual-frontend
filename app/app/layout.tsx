import "./globals.css";
import "@/components/ui/ToastAlert/style.css";
import { Poppins } from "next/font/google";
import { ToastProvider } from "@/components/ui/ToastAlert/ToastAlert";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen">
        {/* Wrap children with the ToastProvider */}
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
