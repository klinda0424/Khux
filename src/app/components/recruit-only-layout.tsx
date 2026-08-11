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

      <main className="flex-1">
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
