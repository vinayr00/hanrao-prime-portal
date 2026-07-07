import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Star } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField, FileUploadField } from "@/components/admin/UploadField";
import {
  listAllProjectsAdmin,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/projects")({
  ssr: false,
  head: () => ({ meta: [{ title: "Projects · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Projects">
      <ProjectsAdmin />
    </AdminShell>
  ),
});

type ProjectRow = any;

const empty = {
  slug: "",
  name: "",
  description: "",
  district: "",
  village: "",
  city: "",
  state: "Telangana",
  thumbnail_url: "",
  gallery_urls: [] as string[],
  map_lat: null as number | null,
  map_lng: null as number | null,
  map_embed_url: "" as string | null,
  brochure_url: "" as string | null,
  status: "active" as "active" | "upcoming" | "sold_out",
  approval_types: [] as string[],
  amenities: [] as string[],
  featured: false,
};

function ProjectsAdmin() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => listAllProjectsAdmin(),
  });
  const [editing, setEditing] = useState<ProjectRow | null>(null);

  const del = useMutation({
    mutationFn: (id: string) => deleteProject({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...empty })}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> New Project
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Location</th>
              <th className="px-4 py-3 text-left">Approvals</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {data.map((p: ProjectRow) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[p.village, p.district].filter(Boolean).join(", ")}
                </td>
                <td className="px-4 py-3">{(p.approval_types || []).join(", ")}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3">{p.featured && <Star className="h-4 w-4 fill-current text-[color:var(--gold)]" />}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(p)} className="mr-2 rounded p-1.5 hover:bg-secondary">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => confirm(`Delete ${p.name}?`) && del.mutate(p.id)}
                    className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!isLoading && data.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No projects yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && <ProjectDialog row={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ProjectDialog({ row, onClose }: { row: ProjectRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>({ ...empty, ...row });
  const isNew = !row.id;

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        map_lat: form.map_lat === "" ? null : form.map_lat,
        map_lng: form.map_lng === "" ? null : form.map_lng,
        brochure_url: form.brochure_url || null,
        map_embed_url: form.map_embed_url || null,
      };
      if (isNew) return createProject({ data: payload });
      return updateProject({ data: { id: row.id, ...payload } });
    },
    onSuccess: () => {
      toast.success("Saved");
      qc.invalidateQueries({ queryKey: ["admin", "projects"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const toggleArr = (k: string, val: string) =>
    setForm((f: any) => ({
      ...f,
      [k]: f[k].includes(val) ? f[k].filter((x: string) => x !== val) : [...f[k], val],
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-background p-6 shadow-luxe">
        <h2 className="font-serif text-2xl font-semibold">{isNew ? "New Project" : "Edit Project"}</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input label="Name" value={form.name} onChange={(v) => setField("name", v)} />
          <Input label="Slug (URL)" value={form.slug} onChange={(v) => setField("slug", v)} />
          <Input label="Village" value={form.village} onChange={(v) => setField("village", v)} />
          <Input label="District" value={form.district} onChange={(v) => setField("district", v)} />
          <Input label="City" value={form.city} onChange={(v) => setField("city", v)} />
          <Input label="State" value={form.state} onChange={(v) => setField("state", v)} />
          <Input
            label="Map Latitude"
            type="number"
            value={form.map_lat ?? ""}
            onChange={(v) => setField("map_lat", v === "" ? null : Number(v))}
          />
          <Input
            label="Map Longitude"
            type="number"
            value={form.map_lng ?? ""}
            onChange={(v) => setField("map_lng", v === "" ? null : Number(v))}
          />
          <Input
            label="Google Maps Embed URL (optional)"
            value={form.map_embed_url ?? ""}
            onChange={(v) => setField("map_embed_url", v)}
            className="sm:col-span-2"
          />
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</div>
          <textarea
            value={form.description}
            onChange={(e) => setField("description", e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</div>
            <select
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="sold_out">Sold out</option>
            </select>
          </div>
          <label className="mt-6 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.featured} onChange={(e) => setField("featured", e.target.checked)} />
            Featured on homepage
          </label>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Approvals</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {["HMDA", "DTCP", "RERA"].map((a) => (
              <button
                type="button"
                key={a}
                onClick={() => toggleArr("approval_types", a)}
                className={`rounded-full border px-3 py-1 text-xs ${
                  form.approval_types.includes(a) ? "border-primary bg-primary text-primary-foreground" : "border-border"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amenities (comma separated)</div>
          <input
            value={form.amenities.join(", ")}
            onChange={(e) => setField("amenities", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div className="mt-6 space-y-4">
          <ImageUploadField
            label="Thumbnail"
            value={form.thumbnail_url ? [form.thumbnail_url] : []}
            onChange={(urls) => setField("thumbnail_url", urls[0] ?? "")}
          />
          <ImageUploadField
            label="Gallery images"
            multiple
            value={form.gallery_urls}
            onChange={(urls) => setField("gallery_urls", urls)}
          />
          <FileUploadField
            label="Brochure (PDF)"
            value={form.brochure_url}
            onChange={(u) => setField("brochure_url", u)}
          />
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

function Input({
  label,
  value,
  onChange,
  type = "text",
  className = "",
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}
