import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type SiteVisit } from "@/lib/adminDb";
import { supabase, isSupabaseUnconfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Trash2, ChevronDown, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/site-visits")({
  ssr: false,
  head: () => ({ meta: [{ title: "Site Visits · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <AdminShell title="Site Visits"><SiteVisits /></AdminShell>,
});

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;

function SiteVisits() {
  const [items, setItems] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchItems = async () => {
    try {
      const data = await adminDb.siteVisits.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    if (!isSupabaseUnconfigured()) {
      const channel = supabase
        .channel('site_visits_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_visits' }, () => {
          fetchItems();
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, []);

  const filtered = useMemo(() => items.filter(v => {
    const match = v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.phone.includes(search) || (v.project_name || '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'all' || v.status === statusFilter;
    return match && statusMatch;
  }), [items, search, statusFilter]);

  const updateStatus = async (v: SiteVisit, status: string) => {
    try {
      await adminDb.siteVisits.update(v.id, { status: status as any });
      await fetchItems();
      toast.success('Status updated');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (v: SiteVisit) => {
    if (!confirm(`Delete visit for ${v.name}?`)) return;
    try {
      await adminDb.siteVisits.delete(v.id);
      await fetchItems();
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === 'pending' ? 'bg-amber-50 text-amber-700' :
    s === 'confirmed' ? 'bg-blue-50 text-blue-700' :
    s === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search visits…"
            className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-52" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
          <option value="all">All Status</option>
          {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <span className="text-sm text-muted-foreground">{filtered.length} visits</span>
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
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Time</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No visits found.</td></tr>
              )}
              {filtered.map(v => (
                <tr key={v.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{v.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{v.project_name || '—'}</td>
                  <td className="px-4 py-3">{new Date(v.preferred_date + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{v.preferred_time}</td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select value={v.status} onChange={e => updateStatus(v, e.target.value)}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium border-0 outline-none cursor-pointer appearance-none pr-6 ${statusColor(v.status)}`}>
                        {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => remove(v)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
