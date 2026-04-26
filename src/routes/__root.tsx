import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { AppShell } from "@/components/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { SplashScreen } from "@/components/SplashScreen";
import { useEffect, useState } from "react";

function NotFoundComponent() {
  return (
    <AppShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-7xl font-bold">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">This page doesn't exist.</p>
          <a href="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            Go home
          </a>
        </div>
      </div>
    </AppShell>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CareMap - Healthcare Intelligence for India" },
      { name: "description", content: "AI-powered analysis of Indian hospital records to identify medical deserts and verify facility claims." },
      { property: "og:title", content: "CareMap - Healthcare Intelligence for India" },
      { property: "og:description", content: "Identify medical deserts and verify facility claims across 10,000+ Indian hospitals." },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const [showSplash, setShowSplash] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setHiding(true), 2500);
    const t2 = window.setTimeout(() => setShowSplash(false), 2800);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen hiding={hiding} />}
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster />
    </>
  );
}
