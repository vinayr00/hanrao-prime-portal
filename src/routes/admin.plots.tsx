import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  listAllPlotsAdmin,
  listAllProjectsAdmin,
  createPlot,
  updatePlot,
  deletePlot,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/plots")({
  ssr: false,
  head: () => ({ meta: [{ title: "Plots · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Plot Management">
      <PlotsAdmin />
    </AdminShell>
  ),
});

const emptyPlot = {
  project_id: "",
  plot_number: "",
  area_sqyd: 200,
  price_per_sqyd: 20000,
  facing: "East",
  plot_type: "open" as const,
  availability: "available" as const,
};

function PlotsAdmin() {
  const qc = useQueryClient();
  const plotsQ = useQuery({ queryKey: ["admin", "plots"], queryFn: () => listAllPlotsAdmin() });
  const projectsQ = useQuery({ queryKey: ["admin", "projects"], queryFn: () => listAllProjectsAdmin() });
  const [editing, setEditing] = useState<any>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const filtered = useMemo(() => {
    const list = plotsQ.data ?? [];
    return list.filter((p: any) => {
      const matchesQ =
        !q ||
        p.plot_number?.toLowerCase().includes(q.toLowerCase()) ||
        p.projects?.name?.toLowerCase().includes(q.toLowerCase());
      const matchesS = !statusFilter || p.availability === statusFilter;
      return matchesQ && matchesS;
    });
  }, [plotsQ.data, q, statusFilter]);

  const del = useMutation({
    mutationFn: (id: string) => deletePlot({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "plots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const quickStatus = useMutation({
    mutationFn: ({ id, availability }: { id: string; availability: string }) =>
      updatePlot({ data: { id, availability: availability as any } }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "plots"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-card px-3 py-2 ring-1 ring-border">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search plot # or project"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-full border border-border bg-card px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
          <option value="sold">Sold</option>
        </select>
        <button
          onClick={() => setEditing({ ...emptyPlot, project_id: projectsQ.data?.[0]?.id ?? "" })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New Plot
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Plot #</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Area (yd²)</th>
              <th className="px-4 py-3 text-left">Price/yd</th>
              <th className="px-4 py-3 text-left">Facing</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {plotsQ.isLoading && (
              <tr><td colSpan={8} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {filtered.map((p: any) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.plot_number}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.projects?.name}</td>
                <td className="px-4 py-3">{p.area_sqyd}</td>
                <td className="px-4 py-3">₹{Number(p.price_per_sqyd).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">{p.facing}</td>
                <td className="px-4 py-3">{p.plot_type}</td>
                <td className="px-4 py-3">
                  <select
                    value={p.availability}
                    onChange={(e) => quickStatus.mutate({ id: p.id, availability: e.target.value })}
                    className="rounded-full border border-border bg-background px-2 py-1 text-xs"
                  >
                    <option value="available">Available</option>
                    <option value="reserved">Reserved</option>
                    <option value="sold">Sold</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 rounded p-1.5 hover:bg-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirm(`Delete plot ${p.plot_number}?`) && del.mutate(p.id)}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!plotsQ.isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No plots.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <PlotDialog
          row={editing}
          projects={projectsQ.data ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function PlotDialog({ row, projects, onClose }: { row: any; projects: any[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({ ...emptyPlot, ...row });
  const isNew = !row.id;
  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        area_sqyd: Number(form.area_sqyd),
        price_per_sqyd: Number(form.price_per_sqyd),
        latitude: form.latitude === "" || form.latitude == null ? null : Number(form.latitude),
        longitude: form.longitude === "" || form.longitude == null ? null : Number(form.longitude),
      };
      delete (payload as any).projects;
      delete (payload as any).id;
      delete (payload as any).created_at;
      if (isNew) return createPlot({ data: payload });
      return updatePlot({ data: { id: row.id, ...payload } });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "plots"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-background p-6 shadow-luxe">
        <h2 className="font-serif text-2xl font-semibold">{isNew ? "New Plot" : "Edit Plot"}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</span>
            <select
              value={form.project_id}
              onChange={(e) => setField("project_id", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>
          <Field label="Plot #" value={form.plot_number} onChange={(v) => setField("plot_number", v)} />
          <Field label="Area (sq.yd)" type="number" value={form.area_sqyd} onChange={(v) => setField("area_sqyd", v)} />
          <Field label="Price / sq.yd (₹)" type="number" value={form.price_per_sqyd} onChange={(v) => setField("price_per_sqyd", v)} />
          <Field label="Facing" value={form.facing} onChange={(v) => setField("facing", v)} />
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</span>
            <select
              value={form.plot_type}
              onChange={(e) => setField("plot_type", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="open">Open plot</option>
              <option value="villa">Villa</option>
              <option value="commercial">Commercial</option>
              <option value="farm">Farm land</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</span>
            <select
              value={form.availability}
              onChange={(e) => setField("availability", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="available">Available</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {save.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: any; onChange: (v: any) => void; type?: string }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
