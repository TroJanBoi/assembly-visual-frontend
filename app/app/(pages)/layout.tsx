// app/(app)/layout.tsx (NESTED)
import "../globals.css";
import SideBar from "@components/layout/SideBar";
import TopNav from "@components/layout/TopNav";
import { Poppins } from "next/font/google";

const poppins = Poppins({ subsets: ["latin"], weight: ["400","500","600","700"] });

export const metadata = { title: "BLYLAB.", description: "" };
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`min-h-screen ${poppins.className}`}>
      <div className="flex">
        <SideBar />
        <div className="flex flex-col w-full">
          <TopNav />
          <main
            role="main"
            style={{
              marginLeft: "var(--sidebar-width, 240px)",
              paddingTop: "var(--topbar-height, 64px)",
              transition: "margin-left 150ms ease-out, padding-top 150ms ease-out",
              height: "100vh",
              boxSizing: "border-box",
              overflow: "auto",
            }}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
