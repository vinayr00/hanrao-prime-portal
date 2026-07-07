import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listVisitsAdmin, updateVisit, deleteVisit } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/visits")({
  ssr: false,
  head: () => ({ meta: [{ title: "Site Visits · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Site Visits">
      <Visits />
    </AdminShell>
  ),
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"];

function Visits() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({ queryKey: ["admin", "visits"], queryFn: () => listVisitsAdmin() });

  const upd = useMutation({
    mutationFn: (vars: any) => updateVisit({ data: vars }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin", "visits"] }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteVisit({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "visits"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Time</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Phone</th>
            <th className="px-4 py-3 text-left">Project</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {isLoading && <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
          {data.map((v: any) => (
            <tr key={v.id}>
              <td className="px-4 py-3">{new Date(v.preferred_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}</td>
              <td className="px-4 py-3">{v.preferred_time}</td>
              <td className="px-4 py-3 font-medium">{v.name}</td>
              <td className="px-4 py-3">{v.phone}</td>
              <td className="px-4 py-3 text-muted-foreground">{v.projects?.name ?? "—"}</td>
              <td className="px-4 py-3">
                <select
                  value={v.status}
                  onChange={(e) => upd.mutate({ id: v.id, status: e.target.value })}
                  className="rounded-full border border-border bg-background px-2 py-1 text-xs"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => confirm("Delete site visit?") && del.mutate(v.id)}
                  className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
          {!isLoading && data.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No visits scheduled.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
