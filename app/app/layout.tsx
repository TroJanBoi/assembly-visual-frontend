import "./globals.css";
import ThemeToggle from "@components/layout/ThemeToggle";
import SideBar from "@components/layout/SideBar";
import TopNav from "@components/layout/TopNav";
import { Poppins } from "next/font/google";
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
      <body className="min-h-screen ">
        <div className="flex">
          <SideBar />

          <div className="flex flex-col w-full">
            <TopNav />
            <main
              role="main"
              style={{
                marginLeft: "var(--sidebar-width, 240px)",
                paddingTop: "var(--topbar-height, 64px)",
                transition:
                  "margin-left 150ms ease-out, padding-top 150ms ease-out",
                height: "100vh",
                
                boxSizing: "border-box",
                overflow: "auto",
              }}
            >
              {/* <ThemeToggle /> */}
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
