import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingActions } from "@/components/FloatingActions";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-semibold text-primary">404</h1>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportError(error, { boundary: "tanstack_root_error_component" }, { mechanism: "react_error_boundary", handled: false, severity: "error" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // ── Primary SEO ──────────────────────────────────────────────────────────
      { title: "Hanrao Prime Portal | Student Learning & Career Platform" },
      {
        name: "description",
        content:
          "Hanrao Prime Portal helps students learn, prepare for placements, practice coding, explore aptitude, AI tools, interview preparation and career resources.",
      },
      {
        name: "keywords",
        content:
          "Hanrao, Prime Portal, Placement Portal, Student Portal, Aptitude, Coding, Interview Preparation, AI Learning, Career Guidance",
      },
      { name: "author", content: "Hanrao" },
      { name: "robots", content: "index, follow" },
      // ── Open Graph ───────────────────────────────────────────────────────────
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Hanrao Prime Portal" },
      {
        property: "og:description",
        content: "AI powered student learning and placement preparation platform.",
      },
      { property: "og:url", content: "https://hanrao.in" },
      { property: "og:image", content: "https://hanrao.in/og-image.png" },
      // ── Twitter Card ─────────────────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Hanrao Prime Portal" },
      {
        name: "twitter:description",
        content: "AI powered placement and learning portal.",
      },
      { name: "twitter:image", content: "https://hanrao.in/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // ── Icons & Manifest ─────────────────────────────────────────────────────
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.json" },
      // ── Canonical ────────────────────────────────────────────────────────────
      { rel: "canonical", href: "https://hanrao.in" },
    ],
    scripts: [
      // ── WebSite Structured Data (JSON-LD) ────────────────────────────────────
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Hanrao Prime Portal",
          url: "https://hanrao.in",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://hanrao.in/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
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
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">
          <Outlet />
        </main>
        <SiteFooter />
        <FloatingActions />
        <Toaster position="top-center" richColors />
      </div>
    </QueryClientProvider>
  );
}
