import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Enquiry } from "@/lib/adminDb";
import { toast } from "sonner";
import { Search, Trash2, X, ChevronDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/enquiries")({
  ssr: false,
  head: () => ({ meta: [{ title: "Enquiries · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <AdminShell title="Enquiries"><Enquiries /></AdminShell>,
});

const STATUSES = ['new', 'contacted', 'interested', 'visited', 'converted', 'lost'] as const;

function Enquiries() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<Enquiry | null>(null);

  const fetchItems = async () => {
    try {
      const data = await adminDb.enquiries.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(() => items.filter(e => {
    const match = e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search) || (e.project_name || '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'all' || e.lead_status === statusFilter;
    return match && statusMatch;
  }), [items, search, statusFilter]);

  const updateStatus = async (e: Enquiry, status: string) => {
    try {
      await adminDb.enquiries.update(e.id, { lead_status: status as any });
      await fetchItems();
      if (selected?.id === e.id) setSelected({ ...e, lead_status: status as any });
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const updateNotes = async (e: Enquiry, notes: string) => {
    try {
      await adminDb.enquiries.update(e.id, { notes });
      await fetchItems();
      toast.success('Notes saved');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (e: Enquiry) => {
    if (!confirm(`Delete enquiry from ${e.name}?`)) return;
    try {
      await adminDb.enquiries.delete(e.id);
      await fetchItems();
      if (selected?.id === e.id) setSelected(null);
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === 'new' ? 'bg-blue-50 text-blue-700' :
    s === 'contacted' ? 'bg-purple-50 text-purple-700' :
    s === 'interested' ? 'bg-amber-50 text-amber-700' :
    s === 'visited' ? 'bg-indigo-50 text-indigo-700' :
    s === 'converted' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search enquiries…"
            className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-52" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} enquiries</span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Project</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Budget</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No enquiries found.</td></tr>
              )}
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-secondary/30 cursor-pointer" onClick={() => setSelected(e)}>
                  <td className="px-4 py-3 font-medium">{e.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{e.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{e.project_name || '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{e.budget || '—'}</td>
                  <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                    <div className="relative">
                      <select value={e.lead_status}
                        onChange={ev => updateStatus(e, ev.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer appearance-none pr-6 ${statusColor(e.lead_status)}`}>
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                    {new Date(e.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                    <button onClick={() => remove(e)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">Enquiry Detail</h2>
              <button onClick={() => setSelected(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Name</span><div className="font-medium">{selected.name}</div></div>
                <div><span className="text-muted-foreground">Phone</span><div className="font-medium">{selected.phone}</div></div>
                <div><span className="text-muted-foreground">Email</span><div>{selected.email || '—'}</div></div>
                <div><span className="text-muted-foreground">Budget</span><div>{selected.budget || '—'}</div></div>
                <div><span className="text-muted-foreground">Project</span><div>{selected.project_name || '—'}</div></div>
                <div><span className="text-muted-foreground">Date</span><div>{new Date(selected.created_at).toLocaleDateString('en-IN')}</div></div>
              </div>
              <div>
                <span className="text-muted-foreground">Message</span>
                <div className="mt-1 rounded-lg bg-secondary/50 px-3 py-2">{selected.message || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</label>
                <textarea
                  defaultValue={selected.notes || ''}
                  onBlur={e => updateNotes(selected, e.target.value)}
                  rows={3}
                  placeholder="Add notes here…"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lead Status</label>
                <select value={selected.lead_status} onChange={e => updateStatus(selected, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                  {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={() => setSelected(null)} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
