import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { listProjects } from "@/lib/realty.functions";

const projectsQuery = { queryKey: ["projects", "all"], queryFn: () => listProjects() };

export const Route = createFileRoute("/projects/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  head: () => ({
    meta: [
      { title: "All Projects — HanRao Realty" },
      {
        name: "description",
        content:
          "Browse all HanRao Realty projects across Hyderabad — HMDA, DTCP and RERA approved open plots, villa plots and farm land.",
      },
      { property: "og:title", content: "All Projects — HanRao Realty" },
      {
        property: "og:description",
        content: "Explore every HanRao Realty community across Hyderabad.",
      },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: ProjectsIndex,
});

const PAGE_SIZE = 9;

function ProjectsIndex() {
  const { data } = useSuspenseQuery(projectsQuery);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter((p) =>
      [p.name, p.village, p.city, p.district, ...p.approval_types]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term)),
    );
  }, [q, data]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="container-luxe py-10 md:py-16">
      <div className="text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Portfolio
        </div>
        <h1 className="mt-2 font-serif text-4xl font-semibold md:text-5xl">Our Projects</h1>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          Every community, curated to the same premium standard.
        </p>
      </div>

      <div className="mx-auto mt-8 flex w-full max-w-xl overflow-hidden rounded-full bg-card p-1.5 shadow-soft ring-1 ring-border">
        <div className="flex flex-1 items-center gap-3 px-4">
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            type="text"
            placeholder="Filter by name, village, district…"
            className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            maxLength={120}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h3 className="font-serif text-2xl font-semibold">No projects match your search</h3>
          <p className="mt-2 text-sm text-muted-foreground">Try a different keyword.</p>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`h-9 min-w-9 rounded-full px-3 text-sm font-medium ${
                currentPage === i + 1
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:border-primary/40"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
