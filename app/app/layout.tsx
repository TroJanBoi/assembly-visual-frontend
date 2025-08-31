import "./globals.css";
import ThemeToggle from "@components/layout/ThemeToggle"
import SideBar from "@components/layout/SideBar";
import TopNav from "@components/layout/TopNav";
import { Poppins } from "next/font/google";
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata = {
  title: "BLYLAB.",
  description: "ทดลอง Dark Mode + Tailwind + CSS Variable",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.className}>
      <body className="min-h-screen ">
        <SideBar />
        <TopNav />

        {/* Content wrapper uses CSS variables set by TopNav and SideBar to avoid overlap */}
        <main
          role="main"
          style={{
            marginLeft: "var(--sidebar-width, 240px)",
            paddingTop: "var(--topbar-height, 64px)",
            transition: "margin-left 150ms ease-out, padding-top 150ms ease-out",
            minHeight: 'calc(100vh - var(--topbar-height, 64px))'
          }}
        >
          {/* <ThemeToggle /> */}
          {children}
        </main>
      </body>
    </html>
  );
}
