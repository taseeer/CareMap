import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Compass, HeartPulse, LayoutDashboard, Map as MapIcon, Moon, Search, Sun, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Map", icon: MapIcon },
  { to: "/facilities", label: "Facilities", icon: Search },
  { to: "/upload", label: "Upload", icon: Upload },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("caremap-theme");
    const dark = stored === "dark";
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((d) => {
      const next = !d;
      localStorage.setItem("caremap-theme", next ? "dark" : "light");
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div
              className="relative h-9 w-9 rounded-xl flex items-center justify-center shadow-[var(--shadow-elegant)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Compass className="h-5 w-5 text-primary-foreground" />
              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-card border border-border flex items-center justify-center">
                <HeartPulse className="h-3.5 w-3.5 text-primary" />
              </span>
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">CareMap</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Healthcare Intelligence for India
              </div>
            </div>
          </Link>
          <div className="hidden md:flex items-center gap-2">
            <nav className="flex items-center gap-1">
              {NAV.map((item) => {
                const active =
                  item.to === "/"
                    ? loc.pathname === "/"
                    : loc.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary ring-1 ring-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/70",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? <Sun className="h-4 w-4 text-muted-foreground" /> : <Moon className="h-4 w-4 text-muted-foreground" />}
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden border-t border-border flex">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? loc.pathname === "/"
                : loc.pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Hack-Nation Challenge #3 · Agentic Healthcare Maps
      </footer>
    </div>
  );
}
