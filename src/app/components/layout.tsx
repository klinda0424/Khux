import { Outlet, Link, useLocation } from "react-router";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { apiFetch } from "../../utils/supabase-client";

export function Layout() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [recruitOpen, setRecruitOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    apiFetch("/recruit-config")
      .then((r) => r.json())
      .then(({ config }) => {
        if (config) setRecruitOpen(config.isOpen ?? false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  const isHome = location.pathname === "/";

  const scrollNavItems = [
    { id: "about", label: "About" },
    { id: "articles", label: "Articles" },
    { id: "activities", label: "Activities" },
    { id: "gallery", label: "Gallery" },
  ];

  useEffect(() => {
    if (!isHome) return;

    const handleScroll = () => {
      const sections = scrollNavItems.map(item => document.getElementById(item.id));
      const scrollPos = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(scrollNavItems[i].id);
          return;
        }
      }
      setActiveSection("");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHome]);

  useEffect(() => {
    if (!isHome) {
      window.scrollTo(0, 0);
    }
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const scrollToSection = (id: string) => {
    if (!isHome) {
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    if (!isHome) {
      window.location.href = "/";
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            <button onClick={scrollToTop} className="flex items-center">
              <span className="text-lg font-extrabold tracking-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
                KH<span className="text-primary">UX</span>
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              {scrollNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-sm font-medium transition-colors ${
                    activeSection === item.id
                      ? "text-foreground"
                      : "text-text-sub hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/notice"
                className={`text-sm font-medium transition-colors ${
                  location.pathname === "/notice"
                    ? "text-foreground"
                    : "text-text-sub hover:text-foreground"
                }`}
              >
                Notice
              </Link>
              {recruitOpen && (
                <Link
                  to="/recruit"
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === "/recruit"
                      ? "text-foreground"
                      : "text-text-sub hover:text-foreground"
                  }`}
                >
                  Recruit
                </Link>
              )}
              <Link
                to="/review/login"
                className="text-sm font-medium px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Members Only
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "light" ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                className="md:hidden p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-1">
              {scrollNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    activeSection === item.id
                      ? "text-foreground bg-surface2"
                      : "text-text-sub hover:text-foreground hover:bg-surface2"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/notice"
                onClick={() => setMobileMenuOpen(false)}
                className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm ${
                  location.pathname === "/notice"
                    ? "text-foreground bg-surface2"
                    : "text-text-sub hover:text-foreground hover:bg-surface2"
                }`}
              >
                Notice
              </Link>
              {recruitOpen && (
                <Link
                  to="/recruit"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm ${
                    location.pathname === "/recruit"
                      ? "text-foreground bg-surface2"
                      : "text-text-sub hover:text-foreground hover:bg-surface2"
                  }`}
                >
                  Recruit
                </Link>
              )}
              <Link
                to="/review/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2.5 rounded-lg transition-colors text-sm font-medium text-primary hover:bg-surface2"
              >
                Members Only
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      <footer className="border-t border-border">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-base font-extrabold tracking-tight" style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.03em' }}>
              KH<span className="text-primary">UX</span>
            </span>
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
