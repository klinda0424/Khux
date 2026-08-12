import { Outlet, Link } from "react-router";
import { useEffect } from "react";
import { Globe, Instagram, Linkedin, Mail } from "lucide-react";
import { SITE_LINKS } from "../data/site-links";
import { PointerGlow } from "./pointer-glow";

const FOOTER_LINKS = [
  { href: SITE_LINKS.mainSite,  label: "KHUX 홈페이지", Icon: Globe },
  { href: SITE_LINKS.instagram, label: "Instagram",     Icon: Instagram },
  { href: SITE_LINKS.linkedin,  label: "LinkedIn",      Icon: Linkedin },
  { href: SITE_LINKS.email && `mailto:${SITE_LINKS.email}`, label: SITE_LINKS.email, Icon: Mail },
].filter((l) => l.href);

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
            <div className="flex items-center gap-5">
              {FOOTER_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </a>
              ))}
              <Link
                to="/admin/login"
                className="text-xs text-muted-foreground/30 hover:text-muted-foreground transition-colors"
              >
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
