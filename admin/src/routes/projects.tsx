import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";

export const Route = createFileRoute("/projects")({
  ssr: false,
  head: () => ({ meta: [{ title: "Projects · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => <AdminShell title="Projects"><Projects /></AdminShell>,
});

type ProjectForm = Omit<Project, 'id' | 'created_at'>;

const EMPTY: ProjectForm = {
  slug: '', name: '', description: '', district: '', village: '', city: '', state: 'Telangana',
  status: 'active', featured: false, thumbnail_url: '', approval_types: [], amenities: [],
  gallery_urls: [], brochure_url: '', location_link: '', rera_number: '',
};

function Projects() {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<null | 'create' | Project>(null);
  const [form, setForm] = useState<ProjectForm>(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const data = await adminDb.projects.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const filtered = useMemo(() =>
    items.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.district.toLowerCase().includes(search.toLowerCase())
    ), [items, search]);

  const openCreate = () => { setForm(EMPTY); setModal('create'); };
  
  const openEdit = (p: Project) => {
    setForm({
      slug: p.slug || '',
      name: p.name || '',
      description: p.description || '',
      district: p.district || '',
      village: p.village || '',
      city: p.city || '',
      state: p.state || 'Telangana',
      status: p.status || 'active',
      featured: !!p.featured,
      thumbnail_url: p.thumbnail_url || '',
      approval_types: p.approval_types || [],
      amenities: p.amenities || [],
      gallery_urls: p.gallery_urls || [],
      brochure_url: p.brochure_url || '',
      location_link: p.location_link || '',
      rera_number: p.rera_number || '',
    });
    setModal(p);
  };

  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.name.trim() || !form.slug.trim()) { toast.error('Name and slug are required'); return; }
    setSaving(true);
    try {
      if (modal === 'create') {
        const n = await adminDb.projects.create(form);
        toast.success(`"${n.name}" created`);
      } else if (modal) {
        await adminDb.projects.update((modal as Project).id, form);
        toast.success('Project updated');
      }
      await fetchItems();
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Project) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      await adminDb.projects.delete(p.id);
      await fetchItems();
      toast.success('Deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === 'active' ? 'bg-emerald-50 text-emerald-700' :
    s === 'upcoming' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary" />
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Add Project
        </button>
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
                <th className="px-4 py-3 text-left hidden md:table-cell">Location</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Approvals</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Featured</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No projects found.</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {p.village ? `${p.village}, ` : ''}{p.city}, {p.district}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">{(p.approval_types || []).join(', ') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {p.featured ? <Check className="h-4 w-4 text-emerald-600" /> : <X className="h-4 w-4 text-muted-foreground" />}
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
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">{modal === 'create' ? 'Add Project' : 'Edit Project'}</h2>
              <button onClick={closeModal}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Name</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Slug (URL)</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                    placeholder="e.g. hanrao-heights"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Village</label>
                  <input value={form.village || ''} onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">City</label>
                  <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">District</label>
                  <input value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">State</label>
                  <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RERA Number</label>
                  <input value={form.rera_number || ''} onChange={e => setForm(f => ({ ...f, rera_number: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thumbnail Image URL</label>
                  <input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Brochure URL</label>
                  <input value={form.brochure_url || ''} onChange={e => setForm(f => ({ ...f, brochure_url: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gallery Image URLs (comma-separated)</label>
                <textarea value={(form.gallery_urls || []).join(', ')}
                  onChange={e => setForm(f => ({ ...f, gallery_urls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                  rows={2}
                  placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Google Map Location Link</label>
                <input value={form.location_link || ''} onChange={e => setForm(f => ({ ...f, location_link: e.target.value }))}
                  placeholder="https://maps.google.com/?q=..."
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approvals (comma-separated)</label>
                  <input value={(form.approval_types || []).join(', ')}
                    onChange={e => setForm(f => ({ ...f, approval_types: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="HMDA, RERA, DTCP"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amenities (comma-separated)</label>
                  <input value={(form.amenities || []).join(', ')}
                    onChange={e => setForm(f => ({ ...f, amenities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                    placeholder="Water Supply, Security, Park"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary">
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  <label htmlFor="featured" className="text-sm font-medium">Featured project</label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={closeModal} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary">Cancel</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal === 'create' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
