import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/analytics")({
  ssr: false,
  head: () => ({ meta: [{ title: "Analytics · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Analytics">
      <Analytics />
    </AdminShell>
  ),
});

function Analytics() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "stats"], queryFn: () => getAdminStats() });
  if (isLoading || !data) return <div className="text-sm text-muted-foreground">Loading…</div>;

  const days: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days[d.toISOString().slice(0, 10)] = 0;
  }
  for (const e of data.recentEnquiries) {
    const k = e.created_at.slice(0, 10);
    if (k in days) days[k]++;
  }
  const max = Math.max(1, ...Object.values(days));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Portfolio breakdown">
        <Row label="Total projects" value={data.projects} />
        <Row label="Total plots" value={data.plots} />
        <Row label="Available" value={data.plotsAvailable} tone="text-emerald-600" />
        <Row label="Reserved" value={data.plotsReserved} tone="text-amber-600" />
        <Row label="Sold" value={data.plotsSold} tone="text-muted-foreground" />
      </Card>
      <Card title="Leads & visits">
        <Row label="Total enquiries" value={data.enquiries} />
        <Row label="New (unread)" value={data.enquiriesNew} tone="text-primary" />
        <Row label="Total site visits" value={data.visits} />
        <Row label="Pending visits" value={data.visitsPending} tone="text-amber-600" />
      </Card>
      <Card title="Enquiries · last 14 days" className="lg:col-span-2">
        <div className="flex h-40 items-end gap-1.5">
          {Object.entries(days).map(([d, n]) => (
            <div key={d} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${(n / max) * 100}%`, minHeight: n ? 4 : 2 }}
                title={`${d}: ${n}`}
              />
              <div className="text-[10px] text-muted-foreground">{d.slice(5)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border ${className}`}>
      <h2 className="font-serif text-lg font-semibold">{title}</h2>
      <div className="mt-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, tone = "" }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-1.5 text-sm last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-serif text-xl font-semibold ${tone}`}>{value}</span>
    </div>
  );
}
