import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Project, Plot, Location, ProjectWithPlots } from "./types";

// Public server-side Supabase client (anon key). RLS applies.
// Untyped generic — DB types aren't generated for these tables yet.
function publicClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
});

export const listFeaturedProjects = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("projects")
    .select("*")
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(6);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Project[];
});

export const getProjectBySlug = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ slug: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }): Promise<ProjectWithPlots | null> => {
    const sb = publicClient();
    const { data: project, error } = await sb
      .from("projects")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;
    const { data: plots, error: pErr } = await sb
      .from("plots")
      .select("*")
      .eq("project_id", (project as { id: string }).id)
      .neq("availability", "sold")
      .order("plot_number");
    if (pErr) throw new Error(pErr.message);
    return {
      ...(project as unknown as Project),
      plots: (plots ?? []) as unknown as Plot[],
    };
  });

export const searchProjects = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z.object({
      q: z.string().max(120).optional().default(""),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      minArea: z.number().optional(),
      maxArea: z.number().optional(),
      plotType: z.enum(["open", "villa", "commercial", "farm"]).optional(),
      approval: z.enum(["DTCP", "HMDA", "RERA"]).optional(),
      sort: z.enum(["newest", "price_asc", "price_desc", "area"]).optional().default("newest"),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("projects").select("*");
    if (data.q?.trim()) {
      const term = `%${data.q.trim()}%`;
      q = q.or(
        `name.ilike.${term},village.ilike.${term},city.ilike.${term},district.ilike.${term},description.ilike.${term}`,
      );
    }
    if (data.approval) q = q.contains("approval_types", [data.approval]);
    const { data: projects, error } = await q;
    if (error) throw new Error(error.message);

    let list = (projects ?? []) as unknown as Project[];

    // Fetch plots to derive price/area filters and min price.
    const ids = list.map((p) => p.id);
    let plots: Plot[] = [];
    if (ids.length > 0) {
      const { data: pd, error: pe } = await sb
        .from("plots")
        .select("*")
        .in("project_id", ids)
        .neq("availability", "sold");
      if (pe) throw new Error(pe.message);
      plots = (pd ?? []) as unknown as Plot[];
    }
    const byProject = new Map<string, Plot[]>();
    for (const p of plots) {
      const arr = byProject.get(p.project_id) ?? [];
      arr.push(p);
      byProject.set(p.project_id, arr);
    }

    const enriched = list
      .map((proj) => {
        let pl = byProject.get(proj.id) ?? [];
        if (data.plotType) pl = pl.filter((p) => p.plot_type === data.plotType);
        if (data.minArea !== undefined) pl = pl.filter((p) => Number(p.area_sqyd) >= data.minArea!);
        if (data.maxArea !== undefined) pl = pl.filter((p) => Number(p.area_sqyd) <= data.maxArea!);
        if (data.minPrice !== undefined)
          pl = pl.filter((p) => Number(p.price_per_sqyd) >= data.minPrice!);
        if (data.maxPrice !== undefined)
          pl = pl.filter((p) => Number(p.price_per_sqyd) <= data.maxPrice!);
        const availablePlots = pl.filter((p) => p.availability === "available");
        const minPrice = pl.length
          ? Math.min(...pl.map((p) => Number(p.price_per_sqyd)))
          : 0;
        const totalArea = pl.reduce((s, p) => s + Number(p.area_sqyd), 0);
        return {
          ...proj,
          _plotCount: pl.length,
          _availableCount: availablePlots.length,
          _minPrice: minPrice,
          _totalArea: totalArea,
        };
      })
      .filter(
        (p) =>
          // if any plot-level filter set, only show projects with matching plots
          !(data.plotType || data.minArea || data.maxArea || data.minPrice || data.maxPrice) ||
          p._plotCount > 0,
      );

    switch (data.sort) {
      case "price_asc":
        enriched.sort((a, b) => a._minPrice - b._minPrice);
        break;
      case "price_desc":
        enriched.sort((a, b) => b._minPrice - a._minPrice);
        break;
      case "area":
        enriched.sort((a, b) => b._totalArea - a._totalArea);
        break;
      default:
        enriched.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }

    return enriched;
  });

export const listLocations = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb.from("locations").select("id, name, type, state").order("name");
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as Location[];
});

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((d) => enquirySchema.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("enquiries").insert({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      message: data.message ?? null,
      project_id: data.project_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const siteVisitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time: z.string().min(1).max(40),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
});

export const submitSiteVisit = createServerFn({ method: "POST" })
  .inputValidator((d) => siteVisitSchema.parse(d))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { error } = await sb.from("site_visits").insert({
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      preferred_date: data.preferred_date,
      preferred_time: data.preferred_time,
      message: data.message ?? null,
      project_id: data.project_id ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
