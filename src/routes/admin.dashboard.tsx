import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminStats } from "@/lib/admin.functions";
import { Building2, MapPinned, MessageSquare, CalendarCheck, ShieldCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/dashboard")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Dashboard">
      <DashboardContent />
    </AdminShell>
  ),
});

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => getAdminStats(),
  });

  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const cards = [
    { label: "Projects", value: data.projects, icon: Building2, to: "/admin/projects" },
    { label: "Plots", value: data.plots, icon: MapPinned, to: "/admin/plots" },
    { label: "Enquiries", value: data.enquiries, icon: MessageSquare, to: "/admin/enquiries" },
    { label: "Site Visits", value: data.visits, icon: CalendarCheck, to: "/admin/visits" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <c.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 font-serif text-3xl font-semibold">{c.value}</div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatTile title="Available plots" value={data.plotsAvailable} icon={ShieldCheck} tone="text-emerald-600" />
        <StatTile title="Reserved" value={data.plotsReserved} icon={TrendingUp} tone="text-amber-600" />
        <StatTile title="Sold" value={data.plotsSold} icon={MapPinned} tone="text-muted-foreground" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <h2 className="font-serif text-lg font-semibold">New enquiries</h2>
          <div className="mt-2 text-3xl font-serif font-semibold text-primary">{data.enquiriesNew}</div>
          <Link to="/admin/enquiries" className="mt-3 inline-block text-xs text-primary hover:underline">
            View all enquiries →
          </Link>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <h2 className="font-serif text-lg font-semibold">Pending site visits</h2>
          <div className="mt-2 text-3xl font-serif font-semibold text-primary">{data.visitsPending}</div>
          <Link to="/admin/visits" className="mt-3 inline-block text-xs text-primary hover:underline">
            View schedule →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number;
  icon: any;
  tone: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
      <div className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${tone}`} />
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</div>
      </div>
      <div className="mt-3 font-serif text-2xl font-semibold">{value}</div>
    </div>
  );
}
