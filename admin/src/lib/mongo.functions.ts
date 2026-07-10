// ─────────────────────────────────────────────────────────────────────────────
// MongoDB Server Functions — all admin & public CRUD via TanStack createServerFn
// ─────────────────────────────────────────────────────────────────────────────
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDb, isMongoConfigured, toDoc, newId } from "./mongodb";
import type {
  Project, Plot, Enquiry, SiteVisit,
  Booking, Customer, Notification,
} from "./mockDb";

// ──────────────────────────────────────────────────────────────────────────────
// Helper — now() ISO string
// ──────────────────────────────────────────────────────────────────────────────
const now = () => new Date().toISOString();

// ══════════════════════════════════════════════════════════════════════════════
// ENQUIRIES
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListEnquiries = createServerFn({ method: "GET" }).handler(
  async (): Promise<Enquiry[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("enquiries")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Enquiry[];
  }
);

export const mongoSubmitEnquiry = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      name: z.string().min(1).max(100),
      phone: z.string().min(6).max(20),
      email: z.string().email().max(255).optional().or(z.literal("").transform(() => undefined)),
      message: z.string().max(2000).optional(),
      project_id: z.string().optional(),
      project_name: z.string().optional(),
      budget: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) {
      return { ok: false, notConfigured: true };
    }
    const db = await getDb();
    const id = newId();
    const enquiry = {
      id,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      message: data.message ?? null,
      project_id: data.project_id ?? null,
      project_name: data.project_name ?? null,
      budget: data.budget ?? null,
      lead_status: "new",
      status: "open",
      notes: null,
      created_at: now(),
    };
    await db.collection("enquiries").insertOne({ ...enquiry });

    // Auto-create customer if phone not already registered
    const existing = await db.collection("customers").findOne({ phone: data.phone });
    if (!existing) {
      await db.collection("customers").insertOne({
        id: newId(),
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        address: null,
        source: "website",
        status: "lead",
        notes: null,
        enquiry_id: id,
        created_at: now(),
      });
    }

    // Create notification
    await db.collection("notifications").insertOne({
      id: newId(),
      title: "New Enquiry",
      message: `${data.name} submitted an enquiry${data.project_name ? ` about ${data.project_name}` : ""}.`,
      type: "info",
      read: false,
      entity_type: "enquiry",
      entity_id: id,
      created_at: now(),
    });

    return { ok: true };
  });

export const mongoUpdateEnquiry = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("enquiries").updateOne({ id }, { $set: updates });

    // Auto-update associated Customer profile lifecycle status
    if (updates.lead_status) {
      const enq = await db.collection("enquiries").findOne({ id });
      if (enq && enq.phone) {
        let newStatus = 'lead';
        if (updates.lead_status === 'converted') newStatus = 'customer';
        else if (updates.lead_status === 'lost') newStatus = 'inactive';
        else if (['contacted', 'interested', 'visited'].includes(updates.lead_status)) newStatus = 'prospect';

        await db.collection("customers").updateOne(
          { phone: enq.phone },
          { $set: { status: newStatus } }
        );
      }
    }
    return { ok: true };
  });

export const mongoDeleteEnquiry = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("enquiries").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// SITE VISITS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListSiteVisits = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteVisit[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("site_visits")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as SiteVisit[];
  }
);

export const mongoSubmitSiteVisit = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      name: z.string().min(1).max(100),
      phone: z.string().min(6).max(20),
      email: z.string().email().max(255).optional().or(z.literal("").transform(() => undefined)),
      preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      preferred_time: z.string().min(1).max(40),
      message: z.string().max(2000).optional(),
      project_id: z.string().optional(),
      project_name: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) {
      return { ok: false, notConfigured: true };
    }
    const db = await getDb();
    const id = newId();
    await db.collection("site_visits").insertOne({
      id,
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      preferred_date: data.preferred_date,
      preferred_time: data.preferred_time,
      message: data.message ?? null,
      project_id: data.project_id ?? null,
      project_name: data.project_name ?? null,
      status: "pending",
      created_at: now(),
    });

    // Notification
    await db.collection("notifications").insertOne({
      id: newId(),
      title: "Site Visit Requested",
      message: `${data.name} requested a site visit on ${data.preferred_date}.`,
      type: "info",
      read: false,
      entity_type: "site_visit",
      entity_id: id,
      created_at: now(),
    });

    return { ok: true };
  });

export const mongoUpdateSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("site_visits").updateOne({ id }, { $set: updates });
    return { ok: true };
  });

export const mongoDeleteSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("site_visits").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListBookings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Booking[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("bookings")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Booking[];
  }
);

export const mongoCreateBooking = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      customer_name: z.string().min(1),
      customer_phone: z.string().min(6),
      project_name: z.string().optional(),
      plot_number: z.string().optional(),
      total_amount: z.number(),
      paid_amount: z.number(),
      status: z.string(),
      booking_date: z.string(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true, id: newId() };
    const db = await getDb();
    const id = newId();
    await db.collection("bookings").insertOne({ id, ...data, created_at: now() });

    // Auto-promote customer status to 'customer'
    if (data.customer_phone) {
      await db.collection("customers").updateOne(
        { phone: data.customer_phone },
        { $set: { status: 'customer' } }
      );
    }

    // Notification
    await db.collection("notifications").insertOne({
      id: newId(),
      title: "New Booking",
      message: `${data.customer_name} booked${data.plot_number ? ` plot ${data.plot_number}` : ""}.`,
      type: "success",
      read: false,
      entity_type: "booking",
      entity_id: id,
      created_at: now(),
    });

    return { ok: true, id };
  });

export const mongoUpdateBooking = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
     if (!isMongoConfigured()) return { ok: false, notConfigured: true };
     const db = await getDb();
     await db.collection("bookings").updateOne({ id }, { $set: updates });
     return { ok: true };
  });

export const mongoDeleteBooking = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("bookings").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListCustomers = createServerFn({ method: "GET" }).handler(
  async (): Promise<Customer[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("customers")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Customer[];
  }
);

export const mongoCreateCustomer = createServerFn({ method: "POST" })
  .validator((d) =>
    z.object({
      name: z.string().min(1),
      phone: z.string().min(6),
      email: z.string().optional(),
      address: z.string().optional(),
      source: z.string().default("website"),
      status: z.string().default("lead"),
      notes: z.string().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    const id = newId();
    await db.collection("customers").insertOne({ id, ...data, created_at: now() });
    return { ok: true, id };
  });

export const mongoUpdateCustomer = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("customers").updateOne({ id }, { $set: updates });
    return { ok: true };
  });

export const mongoDeleteCustomer = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("customers").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<Notification[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("notifications")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Notification[];
  }
);

export const mongoMarkNotificationRead = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("notifications").updateOne({ id }, { $set: { read: true } });
    return { ok: true };
  });

export const mongoMarkAllNotificationsRead = createServerFn({ method: "POST" }).handler(
  async () => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("notifications").updateMany({ read: false }, { $set: { read: true } });
    return { ok: true };
  }
);

export const mongoDeleteNotification = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("notifications").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("projects")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Project[];
  }
);

export const mongoCreateProject = createServerFn({ method: "POST" })
  .validator((d) => z.record(z.any()).parse(d))
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    const id = newId();
    await db.collection("projects").insertOne({ id, ...data, created_at: now() });
    return { ok: true, id };
  });

export const mongoUpdateProject = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("projects").updateOne({ id }, { $set: updates });
    return { ok: true };
  });

export const mongoDeleteProject = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("projects").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// PLOTS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoListPlots = createServerFn({ method: "GET" }).handler(
  async (): Promise<Plot[]> => {
    if (!isMongoConfigured()) return null as any;
    const db = await getDb();
    const docs = await db
      .collection("plots")
      .find({}, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .toArray();
    return docs as unknown as Plot[];
  }
);

export const mongoCreatePlot = createServerFn({ method: "POST" })
  .validator((d) => z.record(z.any()).parse(d))
  .handler(async ({ data }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    const id = newId();
    await db.collection("plots").insertOne({ id, ...data, created_at: now() });
    return { ok: true, id };
  });

export const mongoUpdatePlot = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("plots").updateOne({ id }, { $set: updates });
    return { ok: true };
  });

export const mongoDeletePlot = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    if (!isMongoConfigured()) return { ok: false, notConfigured: true };
    const db = await getDb();
    await db.collection("plots").deleteOne({ id });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════

export const mongoGetStats = createServerFn({ method: "GET" }).handler(async () => {
  if (!isMongoConfigured()) return null as any;
  const db = await getDb();

  const [projects, plots, enquiries, visits, bookings, customers] = await Promise.all([
    db.collection("projects").countDocuments(),
    db.collection("plots").find({}, { projection: { _id: 0, availability: 1 } }).toArray(),
    db.collection("enquiries").find({}, { projection: { _id: 0, lead_status: 1 } }).toArray(),
    db.collection("site_visits").find({}, { projection: { _id: 0, status: 1 } }).toArray(),
    db.collection("bookings").find({}, { projection: { _id: 0, status: 1, paid_amount: 1 } }).toArray(),
    db.collection("customers").countDocuments(),
  ]);

  const revenue = (bookings as any[])
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + Number(b.paid_amount ?? 0), 0);

  return {
    projects,
    plots: plots.length,
    plotsAvailable: (plots as any[]).filter((p) => p.availability === "available").length,
    plotsReserved: (plots as any[]).filter((p) => p.availability === "reserved").length,
    plotsSold: (plots as any[]).filter((p) => p.availability === "sold").length,
    enquiries: enquiries.length,
    enquiriesNew: (enquiries as any[]).filter((e) => e.lead_status === "new").length,
    visits: visits.length,
    visitsPending: (visits as any[]).filter((v) => v.status === "pending").length,
    bookings: bookings.length,
    revenue,
    customers,
  };
});
