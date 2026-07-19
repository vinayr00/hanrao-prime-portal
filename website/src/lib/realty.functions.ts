import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, isMongoConfigured, newId } from "./mongodb";
import type { Project, Plot, Location, ProjectWithPlots } from "./types";
import { db as mockDb } from "./mockDb";

// Convert mockDb Project → public Project type
const mockToPublic = (p: ReturnType<typeof mockDb.projects.list>[number]): Project =>
  ({ ...p, village: '', gallery_urls: [], brochure_url: '', rera_number: '', location_link: '' } as unknown as Project);

const sanitizeProject = (p: Project): Project => {
  let cleanSlug = (p.slug || '').trim();
  if (!cleanSlug || cleanSlug.startsWith('http://') || cleanSlug.startsWith('https://')) {
    cleanSlug = (p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }
  return { ...p, slug: cleanSlug };
};

// ---------------------------------------------------------------------------
// Public server functions — reads from MongoDB (same DB as admin panel)
// ---------------------------------------------------------------------------

export const listProjects = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) return mockDb.projects.list().map(mockToPublic).map(sanitizeProject);
  const db = await getDb();
  const docs = await db
    .collection("projects")
    .find({}, { projection: { _id: 0 } })
    .sort({ featured: -1, created_at: -1 })
    .toArray();
  return (docs as unknown as Project[]).map(sanitizeProject);
});

export const listFeaturedProjects = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) return mockDb.projects.list().filter(p => p.featured).map(mockToPublic).map(sanitizeProject);
  const db = await getDb();
  const docs = await db
    .collection("projects")
    .find({ featured: true }, { projection: { _id: 0 } })
    .sort({ created_at: -1 })
    .limit(6)
    .toArray();
  return (docs as unknown as Project[]).map(sanitizeProject);
});

export const getProjectBySlug = createServerFn({ method: "GET" })
  .validator((d) => z.object({ slug: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }): Promise<ProjectWithPlots | null> => {
    if (!isMongoConfigured()) {
      const p = mockDb.projects.list().find(x => x.slug === data.slug || x.id === data.slug);
      if (!p) return null;
      const plots = mockDb.plots.list().filter(x => x.project_id === p.id);
      return { ...sanitizeProject(mockToPublic(p)), plots: plots as unknown as Plot[] } as ProjectWithPlots;
    }
    const db = await getDb();
    let project = await db
      .collection("projects")
      .findOne(
        {
          $or: [
            { slug: data.slug },
            { id: data.slug },
            { name: { $regex: `^${data.slug.replace(/[^a-zA-Z0-9]/g, '.*')}$`, $options: 'i' } }
          ]
        },
        { projection: { _id: 0 } }
      );

    // Fallback if URL slug is non-matching or malformed
    if (!project) {
      project = await db.collection("projects").findOne({}, { projection: { _id: 0 } });
    }
    if (!project) return null;
    const proj = project as any;
    const plots = await db
      .collection("plots")
      .find(
        { $or: [{ project_id: proj.id }, { project_name: proj.name }] },
        { projection: { _id: 0 } },
      )
      .sort({ plot_number: 1 })
      .toArray();
    return {
      ...sanitizeProject(project as unknown as Project),
      plots: plots as unknown as Plot[],
    };
  });

export const searchProjects = createServerFn({ method: "GET" })
  .validator((d) =>
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
    if (!isMongoConfigured()) return [];
    const db = await getDb();

    // Build project filter
    const projectFilter: Record<string, any> = {};
    if (data.q?.trim()) {
      const regex = { $regex: data.q.trim(), $options: "i" };
      projectFilter.$or = [
        { name: regex }, { village: regex }, { city: regex },
        { district: regex }, { description: regex },
      ];
    }
    if (data.approval) {
      projectFilter.approval_types = { $in: [data.approval] };
    }

    const projects = (await db
      .collection("projects")
      .find(projectFilter, { projection: { _id: 0 } })
      .toArray()) as unknown as Project[];

    if (projects.length === 0) return [];

    const ids = projects.map((p) => p.id);
    const names = projects.map((p) => p.name);

    // Build plot filter — match by project_id (UUID) OR project_name (fallback for legacy data)
    const plotFilter: Record<string, any> = {
      $or: [
        { project_id: { $in: ids } },
        { project_name: { $in: names } },
      ],
      availability: { $ne: "sold" },
    };
    if (data.plotType) plotFilter.plot_type = data.plotType;
    if (data.minArea !== undefined) plotFilter.area_sqyd = { ...plotFilter.area_sqyd, $gte: data.minArea };
    if (data.maxArea !== undefined) plotFilter.area_sqyd = { ...plotFilter.area_sqyd, $lte: data.maxArea };
    if (data.minPrice !== undefined) plotFilter.price_per_sqyd = { ...plotFilter.price_per_sqyd, $gte: data.minPrice };
    if (data.maxPrice !== undefined) plotFilter.price_per_sqyd = { ...plotFilter.price_per_sqyd, $lte: data.maxPrice };

    const allPlots = (await db
      .collection("plots")
      .find(plotFilter, { projection: { _id: 0 } })
      .toArray()) as unknown as Plot[];

    // Build a name→id lookup for fallback matching
    const nameToId = new Map<string, string>();
    for (const proj of projects) nameToId.set(proj.name.toLowerCase(), proj.id);

    const byProject = new Map<string, Plot[]>();
    for (const p of allPlots) {
      // Resolve to the correct project id — try UUID first, then match by name
      let resolvedId = ids.includes(p.project_id) ? p.project_id : undefined;
      if (!resolvedId && (p as any).project_name) {
        resolvedId = nameToId.get(((p as any).project_name as string).toLowerCase());
      }
      if (!resolvedId) continue; // truly orphaned plot
      const arr = byProject.get(resolvedId) ?? [];
      arr.push(p);
      byProject.set(resolvedId, arr);
    }

    const enriched = projects
      .map((proj) => {
        const pl = byProject.get(proj.id) ?? [];
        const availablePlots = pl.filter((p) => p.availability === "available");
        const minPrice = pl.length ? Math.min(...pl.map((p) => Number(p.price_per_sqyd))) : 0;
        const totalArea = pl.reduce((s, p) => s + Number(p.area_sqyd), 0);
        return { ...sanitizeProject(proj), _plotCount: pl.length, _availableCount: availablePlots.length, _minPrice: minPrice, _totalArea: totalArea, _plotImages: pl.flatMap(p => (p as any).images || []).slice(0, 4) };
      })
      .filter(
        (p) =>
          !(data.plotType || data.minArea || data.maxArea || data.minPrice || data.maxPrice) ||
          p._plotCount > 0,
      );

    switch (data.sort) {
      case "price_asc": enriched.sort((a, b) => a._minPrice - b._minPrice); break;
      case "price_desc": enriched.sort((a, b) => b._minPrice - a._minPrice); break;
      case "area": enriched.sort((a, b) => b._totalArea - a._totalArea); break;
      default: enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return enriched;
  });

export const listLocations = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) return [] as Location[];
  const db = await getDb();
  // Derive distinct locations from projects collection
  const docs = await db
    .collection("projects")
    .find({}, { projection: { _id: 0, village: 1, city: 1, district: 1, state: 1 } })
    .toArray();
  const seen = new Set<string>();
  const locations: Location[] = [];
  for (const d of docs as any[]) {
    for (const [type, name] of [["village", d.village], ["city", d.city], ["district", d.district]] as const) {
      if (name && !seen.has(name)) {
        seen.add(name);
        locations.push({ id: name, name, type: type as Location["type"], state: d.state ?? "Telangana" });
      }
    }
  }
  return locations.sort((a, b) => a.name.localeCompare(b.name));
});

// ---------------------------------------------------------------------------
// Enquiry & Site Visit submissions
// ---------------------------------------------------------------------------

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
  project_name: z.string().trim().max(200).optional(),
  budget: z.string().trim().max(100).optional(),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((d) => enquirySchema.parse(d))
  .handler(async ({ data }) => {
    if (!data.name || !data.phone) throw new Error("Name and phone are required.");

    // ── MongoDB (primary) ─────────────────────────────────────────────────────
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      const { mongoSubmitEnquiry } = await import("./mongo.functions");
      return mongoSubmitEnquiry({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email ?? undefined,
          message: data.message ?? undefined,
          project_id: data.project_id ?? undefined,
          project_name: data.project_name ?? undefined,
          budget: data.budget ?? undefined,
        }
      });
    }

    throw new Error("Database not configured. Please set MONGODB_URI in .env");
  });

const siteVisitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z.string().trim().email().max(255).optional().or(z.literal("").transform(() => undefined)),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time: z.string().min(1).max(40),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
  project_name: z.string().trim().max(200).optional(),
});

export const submitSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => siteVisitSchema.parse(d))
  .handler(async ({ data }) => {
    if (!data.name || !data.phone) throw new Error("Name and phone are required.");
    if (!data.preferred_date) throw new Error("Preferred date is required.");

    // ── MongoDB (primary) ─────────────────────────────────────────────────────
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
      const { mongoSubmitSiteVisit } = await import("./mongo.functions");
      return mongoSubmitSiteVisit({
        data: {
          name: data.name,
          phone: data.phone,
          email: data.email ?? undefined,
          preferred_date: data.preferred_date,
          preferred_time: data.preferred_time,
          message: data.message ?? undefined,
          project_id: data.project_id ?? undefined,
          project_name: data.project_name ?? undefined,
        }
      });
    }

    throw new Error("Database not configured. Please set MONGODB_URI in .env");
  });
