// Admin data layer — MongoDB (primary) via server functions
import {
  mongoListEnquiries, mongoUpdateEnquiry, mongoDeleteEnquiry,
  mongoListSiteVisits, mongoUpdateSiteVisit, mongoDeleteSiteVisit,
  mongoListBookings, mongoCreateBooking, mongoUpdateBooking, mongoDeleteBooking,
  mongoListCustomers, mongoCreateCustomer, mongoUpdateCustomer, mongoDeleteCustomer,
  mongoListNotifications, mongoMarkNotificationRead, mongoMarkAllNotificationsRead, mongoDeleteNotification,
  mongoListProjects, mongoCreateProject, mongoUpdateProject, mongoDeleteProject,
  mongoListPlots, mongoCreatePlot, mongoUpdatePlot, mongoDeletePlot,
  mongoGetStats,
} from "./mongo.functions";
import type {
  Project, Plot, Enquiry, SiteVisit, Booking, Customer, Notification,
} from "./mockDb";

export type { Project, Plot, Enquiry, SiteVisit, Booking, Customer, Notification };

const checkMongo = (res: any) => {
  if (res === null || (res && res.notConfigured)) {
    throw new Error("MongoDB database is not configured. Check MONGODB_URI in your .env file.");
  }
};

export const adminDb = {
  // ─── PROJECTS ────────────────────────────────────────────────────────────
  projects: {
    list: async (): Promise<Project[]> => {
      const data = await mongoListProjects();
      checkMongo(data);
      return data || [];
    },
    create: async (d: Omit<Project, 'id' | 'created_at'>): Promise<Project> => {
      const result = await mongoCreateProject({ data: d as any });
      checkMongo(result);
      const list = await mongoListProjects();
      checkMongo(list);
      return list.find((p) => p.id === result.id) ?? ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Project);
    },
    update: async (id: string, d: Partial<Project>): Promise<Project> => {
      const result = await mongoUpdateProject({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListProjects();
      checkMongo(list);
      return list.find((p) => p.id === id) ?? ({ id, ...d } as Project);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteProject({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── PLOTS ───────────────────────────────────────────────────────────────
  plots: {
    list: async (): Promise<Plot[]> => {
      const data = await mongoListPlots();
      checkMongo(data);
      return data || [];
    },
    create: async (d: Omit<Plot, 'id' | 'created_at'>): Promise<Plot> => {
      const result = await mongoCreatePlot({ data: d as any });
      checkMongo(result);
      const list = await mongoListPlots();
      checkMongo(list);
      return list.find((p) => p.id === result.id) ?? ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Plot);
    },
    update: async (id: string, d: Partial<Plot>): Promise<Plot> => {
      const result = await mongoUpdatePlot({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListPlots();
      checkMongo(list);
      return list.find((p) => p.id === id) ?? ({ id, ...d } as Plot);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeletePlot({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── ENQUIRIES ───────────────────────────────────────────────────────────
  enquiries: {
    list: async (): Promise<Enquiry[]> => {
      const data = await mongoListEnquiries();
      checkMongo(data);
      return data || [];
    },
    update: async (id: string, d: Partial<Enquiry>): Promise<Enquiry> => {
      const result = await mongoUpdateEnquiry({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListEnquiries();
      checkMongo(list);
      return list.find((e) => e.id === id) ?? ({ id, ...d } as Enquiry);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteEnquiry({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── SITE VISITS ─────────────────────────────────────────────────────────
  siteVisits: {
    list: async (): Promise<SiteVisit[]> => {
      const data = await mongoListSiteVisits();
      checkMongo(data);
      return data || [];
    },
    update: async (id: string, d: Partial<SiteVisit>): Promise<SiteVisit> => {
      const result = await mongoUpdateSiteVisit({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListSiteVisits();
      checkMongo(list);
      return list.find((v) => v.id === id) ?? ({ id, ...d } as SiteVisit);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteSiteVisit({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── BOOKINGS ────────────────────────────────────────────────────────────
  bookings: {
    list: async (): Promise<Booking[]> => {
      const data = await mongoListBookings();
      checkMongo(data);
      return data || [];
    },
    create: async (d: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> => {
      const result = await mongoCreateBooking({
        data: {
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          project_name: d.project_name,
          plot_number: d.plot_number,
          total_amount: d.total_amount,
          paid_amount: d.paid_amount,
          status: d.status,
          booking_date: d.booking_date,
        }
      });
      checkMongo(result);
      const list = await mongoListBookings();
      checkMongo(list);
      return list.find((b) => b.id === result.id) ?? ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Booking);
    },
    update: async (id: string, d: Partial<Booking>): Promise<Booking> => {
      const result = await mongoUpdateBooking({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListBookings();
      checkMongo(list);
      return list.find((b) => b.id === id) ?? ({ id, ...d } as Booking);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteBooking({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── CUSTOMERS ───────────────────────────────────────────────────────────
  customers: {
    list: async (): Promise<Customer[]> => {
      const data = await mongoListCustomers();
      checkMongo(data);
      return data || [];
    },
    create: async (d: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> => {
      const result = await mongoCreateCustomer({
        data: {
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          address: d.address || undefined,
          source: d.source,
          status: d.status,
          notes: d.notes || undefined,
        }
      });
      checkMongo(result);
      const list = await mongoListCustomers();
      checkMongo(list);
      return list.find((c) => c.id === result.id) ?? ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Customer);
    },
    update: async (id: string, d: Partial<Customer>): Promise<Customer> => {
      const result = await mongoUpdateCustomer({ data: { id, data: d as any } });
      checkMongo(result);
      const list = await mongoListCustomers();
      checkMongo(list);
      return list.find((c) => c.id === id) ?? ({ id, ...d } as Customer);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteCustomer({ data: { id } });
      checkMongo(result);
    },
  },

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  notifications: {
    list: async (): Promise<Notification[]> => {
      const data = await mongoListNotifications();
      checkMongo(data);
      return data || [];
    },
    markRead: async (id: string): Promise<void> => {
      const result = await mongoMarkNotificationRead({ data: { id } });
      checkMongo(result);
    },
    markAllRead: async (): Promise<void> => {
      const result = await mongoMarkAllNotificationsRead();
      checkMongo(result);
    },
    delete: async (id: string): Promise<void> => {
      const result = await mongoDeleteNotification({ data: { id } });
      checkMongo(result);
    },
    unreadCount: async (): Promise<number> => {
      const list = await mongoListNotifications();
      checkMongo(list);
      return list.filter((n) => !n.read).length;
    },
  },

  // ─── STATS ───────────────────────────────────────────────────────────────
  stats: async () => {
    const s = await mongoGetStats();
    checkMongo(s);
    return s || {
      projects: 0, plots: 0, plotsAvailable: 0, plotsReserved: 0, plotsSold: 0,
      enquiries: 0, enquiriesNew: 0, visits: 0, visitsPending: 0,
      bookings: 0, revenue: 0, customers: 0,
    };
  },
};
