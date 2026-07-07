import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { ProjectCard } from "@/components/ProjectCard";
import { searchProjects } from "@/lib/realty.functions";
import { APPROVAL_TYPES, PLOT_TYPES } from "@/lib/site";

const searchSchema = z.object({
  q: z.string().max(120).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minArea: z.number().optional(),
  maxArea: z.number().optional(),
  plotType: z.enum(["open", "villa", "commercial", "farm"]).optional(),
  approval: z.enum(["DTCP", "HMDA", "RERA"]).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "area"]).optional(),
});
type SearchParams = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => searchSchema.parse(s),
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData({
      queryKey: ["search", deps],
      queryFn: () => searchProjects({ data: { ...deps, sort: deps.sort ?? "newest", q: deps.q ?? "" } }),
    }),
  head: () => ({
    meta: [
      { title: "Search Plots — HanRao Realty" },
      {
        name: "description",
        content:
          "Search premium plots across Hyderabad by location, price, area, plot type and approval.",
      },
      { property: "og:title", content: "Search Plots — HanRao Realty" },
      { property: "og:description", content: "Find your perfect plot in Hyderabad." },
    ],
    links: [{ rel: "canonical", href: "/search" }],
  }),
  component: SearchPage,
});

function SearchPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data } = useSuspenseQuery({
    queryKey: ["search", search],
    queryFn: () =>
      searchProjects({
        data: { ...search, sort: search.sort ?? "newest", q: search.q ?? "" },
      }),
  });
  const [qText, setQText] = useState(search.q ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilters = useMemo(() => {
    const arr: { key: string; label: string }[] = [];
    if (search.plotType) arr.push({ key: "plotType", label: search.plotType });
    if (search.approval) arr.push({ key: "approval", label: search.approval });
    if (search.minPrice) arr.push({ key: "minPrice", label: `≥ ₹${search.minPrice}/yd` });
    if (search.maxPrice) arr.push({ key: "maxPrice", label: `≤ ₹${search.maxPrice}/yd` });
    if (search.minArea) arr.push({ key: "minArea", label: `≥ ${search.minArea} yd²` });
    if (search.maxArea) arr.push({ key: "maxArea", label: `≤ ${search.maxArea} yd²` });
    return arr;
  }, [search]);

  return (
    <div className="container-luxe py-10 md:py-14">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">Search</div>
        <h1 className="mt-2 font-serif text-4xl font-semibold md:text-5xl">Find Your Plot</h1>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Search by location, village, district or project name.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: (prev: SearchParams) => ({ ...prev, q: qText.trim() || undefined }) });
        }}
        className="mx-auto mt-8 flex w-full max-w-3xl overflow-hidden rounded-full bg-card p-1.5 shadow-luxe ring-1 ring-border"
      >
        <div className="flex flex-1 items-center gap-3 px-4">
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <input
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            type="text"
            placeholder="Search by Location, Village, District or Project"
            className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            maxLength={120}
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Search
        </button>
      </form>

      <div className="mt-10 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside
          className={`${showFilters ? "block" : "hidden"} lg:block`}
        >
          <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-semibold">Filters</h2>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={() => navigate({ search: { q: search.q } })}
                  className="text-xs text-accent hover:underline"
                >
                  Reset
                </button>
              )}
            </div>

            <FilterGroup label="Plot Type">
              <div className="flex flex-wrap gap-1.5">
                {PLOT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() =>
                      navigate({
                        search: (p: SearchParams) => ({
                          ...p,
                          plotType: p.plotType === t.value ? undefined : t.value,
                        }),
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      search.plotType === t.value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Approval">
              <div className="flex flex-wrap gap-1.5">
                {APPROVAL_TYPES.map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() =>
                      navigate({
                        search: (p: SearchParams) => ({ ...p, approval: p.approval === a ? undefined : a }),
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      search.approval === a
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </FilterGroup>

            <FilterGroup label="Price per sq.yd (₹)">
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  placeholder="Min"
                  value={search.minPrice}
                  onChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, minPrice: v }) })}
                />
                <NumberInput
                  placeholder="Max"
                  value={search.maxPrice}
                  onChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, maxPrice: v }) })}
                />
              </div>
            </FilterGroup>

            <FilterGroup label="Area (sq.yd)">
              <div className="grid grid-cols-2 gap-2">
                <NumberInput
                  placeholder="Min"
                  value={search.minArea}
                  onChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, minArea: v }) })}
                />
                <NumberInput
                  placeholder="Max"
                  value={search.maxArea}
                  onChange={(v) => navigate({ search: (p: SearchParams) => ({ ...p, maxArea: v }) })}
                />
              </div>
            </FilterGroup>
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{data.length}</span> project
              {data.length === 1 ? "" : "s"} found
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </button>
              <select
                value={search.sort ?? "newest"}
                onChange={(e) =>
                  navigate({
                    search: (p: SearchParams) => ({
                      ...p,
                      sort: e.target.value as "newest" | "price_asc" | "price_desc" | "area",
                    }),
                  })
                }
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium outline-none focus:border-primary"
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="area">Total Area</option>
              </select>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="mb-5 flex flex-wrap gap-1.5">
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() =>
                    navigate({ search: (p: SearchParams) => ({ ...p, [f.key]: undefined }) as typeof p })
                  }
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/15"
                >
                  {f.label} <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}

          {data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
              <h3 className="font-serif text-2xl font-semibold">No plots available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try widening your filters or exploring another location.
              </p>
              <Link
                to="/projects"
                className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                View all projects
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              {data.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0 [&+&]:mt-4">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => {
        const n = e.target.value === "" ? undefined : Number(e.target.value);
        onChange(Number.isFinite(n) ? n : undefined);
      }}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
    />
  );
}
