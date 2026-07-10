import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Plot, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/plots")({
  ssr: false,
  head: () => ({ meta: [{ title: "Plots · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <AdminShell title="Plot Management"><Plots /></AdminShell>,
});

type PlotForm = Omit<Plot, 'id' | 'created_at'>;
const EMPTY_FORM: PlotForm = {
  project_id: '', project_name: '', plot_number: '', area_sqyd: 200,
  price_per_sqyd: 18000, facing: 'East', plot_type: 'open', availability: 'available',
};

function Plots() {
  const [items, setItems] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [avFilter, setAvFilter] = useState<string>('all');
  const [modal, setModal] = useState<null | 'create' | Plot>(null);
  const [form, setForm] = useState<PlotForm>(EMPTY_FORM);

  const fetchItems = async () => {
    try {
      const [plotData, projData] = await Promise.all([
        adminDb.plots.list(),
        adminDb.projects.list(),
      ]);
      setItems(plotData);
      setProjects(projData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() => items.filter(p => {
    const matchSearch = p.plot_number.toLowerCase().includes(search.toLowerCase()) || (p.project_name || '').toLowerCase().includes(search.toLowerCase());
    const matchAv = avFilter === 'all' || p.availability === avFilter;
    return matchSearch && matchAv;
  }), [items, search, avFilter]);

  const openCreate = () => { setForm({ ...EMPTY_FORM, project_id: projects[0]?.id ?? '', project_name: projects[0]?.name ?? '' }); setModal('create'); };
  const openEdit = (p: Plot) => { setForm({ project_id: p.project_id, project_name: p.project_name || '', plot_number: p.plot_number, area_sqyd: p.area_sqyd, price_per_sqyd: p.price_per_sqyd, facing: p.facing, plot_type: p.plot_type, availability: p.availability }); setModal(p); };
  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.plot_number.trim()) { toast.error('Plot number required'); return; }
    try {
      if (modal === 'create') {
        await adminDb.plots.create(form);
        toast.success('Plot created');
      } else if (modal) {
        await adminDb.plots.update((modal as Plot).id, form);
        toast.success('Plot updated');
      }
      await fetchItems();
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (p: Plot) => {
    if (!confirm(`Delete plot ${p.plot_number}?`)) return;
    try {
      await adminDb.plots.delete(p.id);
      await fetchItems();
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const avColor = (a: string) =>
    a === 'available' ? 'bg-emerald-50 text-emerald-700' :
    a === 'reserved' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search plots…"
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-52" />
          </div>
          <select value={avFilter} onChange={e => setAvFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="reserved">Reserved</option>
            <option value="sold">Sold</option>
          </select>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Plot
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Plot No.</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Project</th>
              <th className="px-4 py-3 text-left">Area (SqYd)</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Price/SqYd</th>
              <th className="px-4 py-3 text-left hidden lg:table-cell">Type</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No plots found.</td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium">{p.plot_number}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{p.project_name}</td>
                <td className="px-4 py-3">{p.area_sqyd}</td>
                <td className="px-4 py-3 hidden md:table-cell">₹{p.price_per_sqyd.toLocaleString()}</td>
                <td className="px-4 py-3 capitalize hidden lg:table-cell">{p.plot_type}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${avColor(p.availability)}`}>{p.availability}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(p)} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => remove(p)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">{modal === 'create' ? 'Add Plot' : 'Edit Plot'}</h2>
              <button onClick={closeModal}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</label>
                <select value={form.project_id} onChange={e => {
                  const proj = projects.find(p => p.id === e.target.value);
                  setForm(f => ({ ...f, project_id: e.target.value, project_name: proj?.name ?? '' }));
                }} className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plot Number</label>
                <input value={form.plot_number} onChange={e => setForm(f => ({ ...f, plot_number: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area (Sq.Yd)</label>
                  <input type="number" value={form.area_sqyd} onChange={e => setForm(f => ({ ...f, area_sqyd: +e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price/SqYd (₹)</label>
                  <input type="number" value={form.price_per_sqyd} onChange={e => setForm(f => ({ ...f, price_per_sqyd: +e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facing</label>
                  <select value={form.facing} onChange={e => setForm(f => ({ ...f, facing: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                    {['East','West','North','South','North-East','North-West','South-East','South-West'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</label>
                  <select value={form.plot_type} onChange={e => setForm(f => ({ ...f, plot_type: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                    <option value="open">Open</option>
                    <option value="villa">Villa</option>
                    <option value="commercial">Commercial</option>
                    <option value="farm">Farm</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Availability</label>
                <select value={form.availability} onChange={e => setForm(f => ({ ...f, availability: e.target.value as any }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="sold">Sold</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={closeModal} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
              <button onClick={save} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
