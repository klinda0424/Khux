import { Outlet, Link, useLocation } from "react-router";
import { useEffect } from "react";
import { PointerGlow } from "./pointer-glow";
import { DEFAULT_RECRUIT_CONFIG } from "../types/recruit-config";

// https://khux3rdrecruiting.vercel.app/ 의 Home / KHUX N기 / Apply 3단 nav 구조를 그대로 이식.
export function RecruitOnlyLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const isApply = location.pathname === "/recruit";

  useEffect(() => {
    document.title = "KHUX Recruit - 지원하기";
    document.documentElement.classList.add("dark");
  }, []);

  // 홈이 아닌 페이지(예: /recruit)에서 클릭하면 홈으로 이동 후 해당 섹션으로 스크롤.
  const goToSection = (id: string) => {
    if (!isHome) {
      window.location.href = `/#${id}`;
      return;
    }
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToTop = () => {
    if (!isHome) {
      window.location.href = "/";
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PointerGlow />
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <a
              href="https://khux.vercel.app"
              target="_blank"
              rel="noreferrer"
              className="flex items-center"
            >
              <span
                className="text-lg font-extrabold tracking-tight"
                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: "-0.03em" }}
              >
                KH<span className="text-primary">UX</span>
              </span>
            </a>

            <nav className="flex items-center gap-6 sm:gap-8 text-xs uppercase tracking-[0.28em]">
              <button
                onClick={scrollToTop}
                className={`transition-colors ${
                  isHome ? "text-foreground font-medium" : "text-text-sub hover:text-foreground"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => goToSection("tracks")}
                className="text-text-sub hover:text-foreground transition-colors"
              >
                {DEFAULT_RECRUIT_CONFIG.generation}
              </button>
              <Link
                to="/recruit"
                className={`transition-colors ${
                  isApply ? "text-foreground font-medium" : "text-text-sub hover:text-foreground"
                }`}
              >
                Apply
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} KHUX — Kyung Hee University UX Lab
            </p>
            <Link
              to="/admin/login"
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
