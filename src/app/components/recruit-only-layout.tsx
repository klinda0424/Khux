import { Outlet, Link } from "react-router";
import { useEffect } from "react";
import { PointerGlow } from "./pointer-glow";

export function RecruitOnlyLayout() {
  useEffect(() => {
    document.title = "KHUX Recruit - 지원하기";
    document.documentElement.classList.add("dark");
  }, []);

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
            <span className="text-sm font-medium text-text-sub">Recruit</span>
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
