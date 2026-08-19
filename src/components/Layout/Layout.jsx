import { useState } from "react";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import Sidebar from "../Header/Sidebar";

const Layout = ({ children }) => {
  const [sideOpen, setSideOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-100px] h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[140px] h-[280px] w-[280px] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.02)_0%,_transparent_22%)]" />
      </div>

      <Sidebar sideOpen={sideOpen} setSideOpen={setSideOpen} />

      <div className="relative z-10 xl:pl-[288px]">
        <div className="fixed inset-x-0 top-0 z-40 xl:left-[288px]">
          <Header setSideOpen={setSideOpen} />
        </div>

        <main className="min-h-screen pt-[84px]">{children}</main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
