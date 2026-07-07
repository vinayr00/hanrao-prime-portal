import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listEnquiriesAdmin, updateEnquiry, deleteEnquiry } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/enquiries")({
  ssr: false,
  head: () => ({ meta: [{ title: "Enquiries · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Enquiries">
      <EnquiriesView />
    </AdminShell>
  ),
});

const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"];

function EnquiriesView() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: () => listEnquiriesAdmin(),
  });
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const filtered = useMemo(
    () =>
      data.filter((e: any) =>
        !q ||
        e.name?.toLowerCase().includes(q.toLowerCase()) ||
        e.phone?.includes(q) ||
        e.email?.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q],
  );

  const upd = useMutation({
    mutationFn: (vars: any) => updateEnquiry({ data: vars }),
    onSuccess: () => {
      toast.success("Updated");
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteEnquiry({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
      setSelected(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full bg-card px-3 py-2 ring-1 ring-border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, phone or email"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Received</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Project</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>}
            {filtered.map((e: any) => (
              <tr key={e.id} className="cursor-pointer hover:bg-secondary/40" onClick={() => setSelected(e)}>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(e.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </td>
                <td className="px-4 py-3 font-medium">{e.name}</td>
                <td className="px-4 py-3">{e.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{e.projects?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <select
                    value={e.lead_status || "new"}
                    onClick={(ev) => ev.stopPropagation()}
                    onChange={(ev) => upd.mutate({ id: e.id, lead_status: ev.target.value })}
                    className="rounded-full border border-border bg-background px-2 py-1 text-xs"
                  >
                    {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={(ev) => { ev.stopPropagation(); confirm("Delete enquiry?") && del.mutate(e.id); }}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No enquiries.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <EnquiryDialog
          row={selected}
          onClose={() => setSelected(null)}
          onSave={(patch) => upd.mutate({ id: selected.id, ...patch })}
          onDelete={() => del.mutate(selected.id)}
        />
      )}
    </div>
  );
}

function EnquiryDialog({
  row, onClose, onSave, onDelete,
}: { row: any; onClose: () => void; onSave: (p: any) => void; onDelete: () => void }) {
  const [notes, setNotes] = useState(row.notes ?? "");
  const [budget, setBudget] = useState(row.budget ?? "");
  const [status, setStatus] = useState(row.lead_status ?? "new");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-background p-6 shadow-luxe">
        <h2 className="font-serif text-2xl font-semibold">{row.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{row.phone} · {row.email || "—"}</p>
        {row.projects && (
          <p className="mt-1 text-sm text-muted-foreground">Project: <span className="text-foreground">{row.projects.name}</span></p>
        )}
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Message</div>
          <div className="mt-1 rounded-lg bg-secondary/50 p-3 text-sm">{row.message || "—"}</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              {LEAD_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Budget</span>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="e.g. 20-30L"
            />
          </label>
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Private notes</div>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-6 flex justify-between">
          <button onClick={() => confirm("Delete enquiry?") && onDelete()} className="text-sm text-destructive">Delete</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm">Close</button>
            <button
              onClick={() => { onSave({ notes, budget, lead_status: status }); onClose(); }}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
