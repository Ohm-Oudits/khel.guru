import { useLocation } from "react-router-dom";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import Sidebar from "../Header/Sidebar";
import GameBackButton, { isGameRoute } from "../platform/GameBackButton";

const Layout = ({ children }) => {
  const { pathname } = useLocation();
  const showGameBack = isGameRoute(pathname);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background-primary text-text-primary">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-[-120px] top-[-100px] h-[320px] w-[320px] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute right-[-120px] top-[140px] h-[280px] w-[280px] rounded-full bg-amber-300/10 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-[320px] w-[320px] rounded-full bg-cyan-400/8 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(255,255,255,0.02)_0%,_transparent_22%)]" />
      </div>

      <Sidebar />

      <div className="relative z-10 xl:pl-[288px]">
        <div className="fixed inset-x-0 top-0 z-40">
          <Header />
        </div>

        <main
          className={
            showGameBack
              ? "game-route min-h-screen pb-28 pt-[72px] lg:h-screen lg:overflow-hidden lg:pb-0 lg:pt-[100px] xl:pt-[108px]"
              : "min-h-screen pb-28 pt-[72px] lg:pt-[100px] xl:pt-[108px] xl:pb-0"
          }
        >
          {showGameBack ? <GameBackButton /> : null}
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
