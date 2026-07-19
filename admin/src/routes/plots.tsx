import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Plot, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, X, Loader2 } from "lucide-react";

export const Route = createFileRoute("/plots")({
  ssr: false,
  head: () => ({ meta: [{ title: "Plots · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <AdminShell title="Plot Management"><Plots /></AdminShell>,
});

type PlotForm = Omit<Plot, 'id' | 'created_at'>;
const EMPTY_FORM: PlotForm = {
  project_id: '', project_name: '', plot_number: '', area_sqyd: 200,
  price_per_sqyd: 18000, facing: 'East', plot_type: 'open', availability: 'available',
  images: [],
};

function Plots() {
  const [items, setItems] = useState<Plot[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  const openCreate = () => { setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (p: Plot) => { setForm({ project_id: p.project_id, project_name: p.project_name || '', plot_number: p.plot_number, area_sqyd: p.area_sqyd, price_per_sqyd: p.price_per_sqyd, facing: p.facing, plot_type: p.plot_type, availability: p.availability, images: p.images || [] }); setModal(p); };
  const closeModal = () => setModal(null);

  // Check if current project_name matches a real project
  const matchedProject = projects.find(p => p.name.toLowerCase() === form.project_name.trim().toLowerCase());

  const save = async () => {
    if (saving) return;
    if (!form.project_name.trim()) { toast.error('Project name required'); return; }
    if (!form.plot_number.trim()) { toast.error('Plot number required'); return; }
    // Ensure project_id is linked to a real project
    if (!matchedProject) {
      toast.error('Project not found. Please select an existing project from the list.');
      return;
    }
    // Always ensure project_id is the real UUID before saving
    const payload = { ...form, project_id: matchedProject.id, project_name: matchedProject.name };
    setSaving(true);
    try {
      if (modal === 'create') {
        await adminDb.plots.create(payload);
        toast.success('Plot created');
      } else if (modal && typeof modal === 'object') {
        await adminDb.plots.update((modal as Plot).id, payload);
        toast.success('Plot updated');
      }
      await fetchItems();
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e: React.MouseEvent, p: Plot) => {
    e.stopPropagation();
    if (!confirm(`Delete plot ${p.plot_number}?`)) return;
    try {
      await adminDb.plots.delete(p.id);
      setItems(prev => prev.filter(x => x.id !== p.id));
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
                    <button type="button" onClick={e => { e.stopPropagation(); openEdit(p); }} className="rounded p-1.5 hover:bg-secondary"><Pencil className="h-4 w-4 text-muted-foreground" /></button>
                    <button type="button" onClick={e => remove(e, p)} className="rounded p-1.5 hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
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
                <div className="relative">
                  <input
                    list="projects-list"
                    value={form.project_name}
                    onChange={e => {
                      const name = e.target.value;
                      const proj = projects.find(p => p.name.toLowerCase() === name.toLowerCase());
                      setForm(f => ({
                        ...f,
                        project_name: name,
                        project_id: proj ? proj.id : ''
                      }));
                    }}
                    placeholder="Type project name..."
                    className={`mt-1 w-full rounded-lg border bg-background px-3 py-2 pr-8 text-sm outline-none focus:border-primary ${
                      form.project_name.trim()
                        ? matchedProject
                          ? 'border-emerald-400'
                          : 'border-red-300'
                        : 'border-border'
                    }`}
                  />
                  {form.project_name.trim() && (
                    <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 mt-0.5 text-xs font-semibold ${
                      matchedProject ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {matchedProject ? '✓' : '✗'}
                    </span>
                  )}
                </div>
                <datalist id="projects-list">
                  {projects.map(p => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
                {form.project_name.trim() && !matchedProject && (
                  <p className="mt-1 text-xs text-red-500">No matching project found. Create the project first in Projects page.</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plot Number</label>
                <input value={form.plot_number} onChange={e => setForm(f => ({ ...f, plot_number: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Area (Sq.Yd)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.area_sqyd === 0 ? '' : String(form.area_sqyd)}
                    placeholder="e.g. 200"
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) setForm(f => ({ ...f, area_sqyd: val === '' ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Price/SqYd (₹)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.price_per_sqyd === 0 ? '' : String(form.price_per_sqyd)}
                    placeholder="e.g. 18000"
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d*$/.test(val)) setForm(f => ({ ...f, price_per_sqyd: val === '' ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
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
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Plot Images <span className="normal-case font-normal">(up to 4)</span>
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const img = (form.images || [])[idx];
                    return img ? (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={img} alt={`Plot image ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setForm(f => ({ ...f, images: (f.images || []).filter((_, i) => i !== idx) }))}
                          className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-medium"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        key={idx}
                        htmlFor={`plot-img-${idx}`}
                        className={`aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors ${
                          (form.images || []).length >= 4
                            ? 'border-border opacity-40 cursor-not-allowed'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                        }`}
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground mt-1">Photo {idx + 1}</span>
                        <input
                          id={`plot-img-${idx}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          disabled={(form.images || []).length >= 4}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
                            const reader = new FileReader();
                            reader.onload = ev => setForm(f => ({ ...f, images: [...(f.images || []), ev.target?.result as string] }));
                            reader.readAsDataURL(file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
                {(form.images || []).length > 0 && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    {form.images!.length}/4 added · Hover a photo to remove it
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={closeModal} disabled={saving} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-50">Cancel</button>
              <button type="button" onClick={save} disabled={saving} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2">
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
