import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

// ---------- Auth / bootstrap ----------

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await (context as any).supabase.rpc("has_role", {
      _user_id: (context as any).userId,
      _role: "admin",
    });
    if (error) throw new Error(error.message);
    return { isAdmin: Boolean(data) };
  });

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (error) throw new Error(error.message);
    if ((count ?? 0) > 0) throw new Error("Admin already exists. Ask an existing admin for access.");
    const { error: insErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: (context as any).userId,
      role: "admin",
    });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });

// ---------- Projects ----------

const projectSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  description: z.string().max(5000).default(""),
  district: z.string().max(120).default(""),
  village: z.string().max(120).default(""),
  city: z.string().max(120).default(""),
  state: z.string().max(120).default("Telangana"),
  thumbnail_url: z.string().max(1000).default(""),
  gallery_urls: z.array(z.string().max(1000)).default([]),
  map_lat: z.number().nullable().optional(),
  map_lng: z.number().nullable().optional(),
  map_embed_url: z.string().max(2000).nullable().optional(),
  brochure_url: z.string().max(1000).nullable().optional(),
  status: z.enum(["active", "upcoming", "sold_out"]).default("active"),
  approval_types: z.array(z.string().max(20)).default([]),
  amenities: z.array(z.string().max(80)).default([]),
  featured: z.boolean().default(false),
});

export const listAllProjectsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data, error } = await (context as any).supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => projectSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data: row, error } = await (context as any).supabase
      .from("projects")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).and(projectSchema.partial()).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { id, ...rest } = data as any;
    const { data: row, error } = await (context as any).supabase
      .from("projects")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { error } = await (context as any).supabase.from("projects").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Plots ----------

const plotSchema = z.object({
  project_id: z.string().uuid(),
  plot_number: z.string().min(1).max(40),
  area_sqyd: z.number().positive(),
  price_per_sqyd: z.number().positive(),
  facing: z.string().max(40).default("East"),
  plot_type: z.enum(["open", "villa", "commercial", "farm"]).default("open"),
  availability: z.enum(["available", "reserved", "sold"]).default("available"),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

export const listAllPlotsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data, error } = await (context as any).supabase
      .from("plots")
      .select("*, projects(name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createPlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => plotSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data: row, error } = await (context as any).supabase
      .from("plots")
      .insert(data)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).and(plotSchema.partial()).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { id, ...rest } = data as any;
    const { data: row, error } = await (context as any).supabase
      .from("plots")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePlot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { error } = await (context as any).supabase.from("plots").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Enquiries / Customers ----------

export const listEnquiriesAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data, error } = await (context as any).supabase
      .from("enquiries")
      .select("*, projects(name, slug)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      id: z.string().uuid(),
      lead_status: z.string().max(40).optional(),
      notes: z.string().max(4000).optional(),
      status: z.string().max(40).optional(),
      budget: z.string().max(80).optional(),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { id, ...rest } = data;
    const { data: row, error } = await (context as any).supabase
      .from("enquiries")
      .update(rest)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteEnquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { error } = await (context as any).supabase.from("enquiries").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Site visits ----------

export const listVisitsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { data, error } = await (context as any).supabase
      .from("site_visits")
      .select("*, projects(name, slug)")
      .order("preferred_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updateVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), status: z.string().max(40) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { error } = await (context as any).supabase
      .from("site_visits")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteVisit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const { error } = await (context as any).supabase.from("site_visits").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Analytics ----------

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin((context as any).supabase, (context as any).userId);
    const sb = (context as any).supabase;
    const [projects, plots, enquiries, visits] = await Promise.all([
      sb.from("projects").select("id, status", { count: "exact" }),
      sb.from("plots").select("id, availability", { count: "exact" }),
      sb.from("enquiries").select("id, lead_status, created_at", { count: "exact" }),
      sb.from("site_visits").select("id, status, created_at", { count: "exact" }),
    ]);
    const plotList = (plots.data ?? []) as { availability: string }[];
    const enqList = (enquiries.data ?? []) as { lead_status: string; created_at: string }[];
    const visitList = (visits.data ?? []) as { status: string; created_at: string }[];
    return {
      projects: projects.count ?? 0,
      plots: plots.count ?? 0,
      plotsAvailable: plotList.filter((p) => p.availability === "available").length,
      plotsReserved: plotList.filter((p) => p.availability === "reserved").length,
      plotsSold: plotList.filter((p) => p.availability === "sold").length,
      enquiries: enquiries.count ?? 0,
      enquiriesNew: enqList.filter((e) => e.lead_status === "new").length,
      visits: visits.count ?? 0,
      visitsPending: visitList.filter((v) => v.status === "pending").length,
      recentEnquiries: enqList.slice(0, 30),
      recentVisits: visitList.slice(0, 30),
    };
  });
