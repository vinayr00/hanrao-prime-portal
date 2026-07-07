import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Compass,
  Download,
  MapPin,
  Phone,
  Ruler,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { getProjectBySlug, submitEnquiry, submitSiteVisit } from "@/lib/realty.functions";
import { SITE, formatINR, formatPricePerSqYd } from "@/lib/site";
import type { Plot, ProjectWithPlots } from "@/lib/types";

export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData({
      queryKey: ["project", params.slug],
      queryFn: () => getProjectBySlug({ data: { slug: params.slug } }),
    });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Project not found — HanRao Realty" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const p = loaderData;
    const location = [p.village, p.district].filter(Boolean).join(", ");
    const desc = `${p.name} in ${location}. ${p.approval_types.join(", ")} approved. ${p.description.slice(0, 120)}`;
    return {
      meta: [
        { title: `${p.name} — ${location} · HanRao Realty` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name} — ${location}` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        ...(p.thumbnail_url ? [{ property: "og:image", content: p.thumbnail_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/projects/${p.slug}` }],
    };
  },
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const project = Route.useLoaderData();
  const { data } = useSuspenseQuery({
    queryKey: ["project", project.slug],
    queryFn: () => getProjectBySlug({ data: { slug: project.slug } }),
  });
  const p = (data ?? project) as ProjectWithPlots;

  const availablePlots = p.plots.filter((x) => x.availability === "available");
  const minPrice = p.plots.length ? Math.min(...p.plots.map((x) => Number(x.price_per_sqyd))) : 0;
  const totalArea = p.plots.reduce((s, x) => s + Number(x.area_sqyd), 0);

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: p.name, url });
      } catch {
        /* user cancelled */
      }
    } else if (url) {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div>
      <Gallery images={p.gallery_urls.length ? p.gallery_urls : [p.thumbnail_url]} name={p.name} />

      <div className="container-luxe grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-14">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {p.approval_types.map((a) => (
              <span
                key={a}
                className="rounded-full bg-primary/10 px-3 py-1 font-semibold uppercase tracking-wider text-primary"
              >
                {a} Approved
              </span>
            ))}
            {p.status === "upcoming" && (
              <span className="rounded-full bg-accent px-3 py-1 font-semibold uppercase tracking-wider text-accent-foreground">
                Upcoming
              </span>
            )}
          </div>
          <h1 className="mt-4 font-serif text-4xl font-semibold md:text-5xl">{p.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4 text-accent" />
            {[p.village, p.district, p.state].filter(Boolean).join(", ")}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat icon={Ruler} label="Starting" value={minPrice ? formatPricePerSqYd(minPrice) : "—"} />
            <Stat icon={Compass} label="Total Plots" value={String(p.plots.length)} />
            <Stat icon={ShieldCheck} label="Available" value={String(availablePlots.length)} />
            <Stat icon={MapPin} label="Total Area" value={`${totalArea.toLocaleString("en-IN")} sq.yd`} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              onClick={share}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/50"
            >
              <Share2 className="h-4 w-4" /> Share
            </button>
            {p.brochure_url && (
              <a
                href={p.brochure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary/50"
              >
                <Download className="h-4 w-4" /> Brochure
              </a>
            )}
            <a
              href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
                `Hi HanRao Realty, I'm interested in ${p.name}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              WhatsApp
            </a>
            <a
              href={`tel:${SITE.phoneE164}`}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Phone className="h-4 w-4" /> Call
            </a>
          </div>

          <Section title="About this project">
            <p className="whitespace-pre-line leading-relaxed text-foreground/85">{p.description}</p>
          </Section>

          {p.amenities.length > 0 && (
            <Section title="Amenities">
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {p.amenities.map((a) => (
                  <li
                    key={a}
                    className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm ring-1 ring-border"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {a}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="Available plots">
            <div className="overflow-hidden rounded-2xl ring-1 ring-border">
              <table className="w-full text-sm">
                <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left">Plot #</th>
                    <th className="px-4 py-3 text-left">Area</th>
                    <th className="px-4 py-3 text-left">Facing</th>
                    <th className="px-4 py-3 text-left">Price/sq.yd</th>
                    <th className="px-4 py-3 text-left">Total</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {p.plots.map((pl: Plot) => {
                    const total = Number(pl.area_sqyd) * Number(pl.price_per_sqyd);
                    return (
                      <tr key={pl.id}>
                        <td className="px-4 py-3 font-medium">{pl.plot_number}</td>
                        <td className="px-4 py-3">{pl.area_sqyd} yd²</td>
                        <td className="px-4 py-3">{pl.facing}</td>
                        <td className="px-4 py-3">{formatPricePerSqYd(Number(pl.price_per_sqyd))}</td>
                        <td className="px-4 py-3 font-medium">{formatINR(total)}</td>
                        <td className="px-4 py-3">
                          <AvailabilityBadge value={pl.availability} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Nearby">
            <div className="grid gap-3 sm:grid-cols-2">
              {p.nearby.schools && p.nearby.schools.length > 0 && (
                <NearbyGroup title="Schools" items={p.nearby.schools} />
              )}
              {p.nearby.hospitals && p.nearby.hospitals.length > 0 && (
                <NearbyGroup title="Hospitals" items={p.nearby.hospitals} />
              )}
              {p.nearby.highway_km !== undefined && (
                <NearbyGroup title="Connectivity" items={[
                  { name: "Nearest Highway", distance: `${p.nearby.highway_km} km` },
                  ...(p.nearby.airport_km !== undefined ? [{ name: "Airport", distance: `${p.nearby.airport_km} km` }] : []),
                ]} />
              )}
            </div>
          </Section>

          <Section title="Location">
            {p.map_embed_url ? (
              <iframe
                src={p.map_embed_url}
                title={`Map of ${p.name}`}
                loading="lazy"
                className="h-[380px] w-full rounded-2xl border border-border"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : p.map_lat && p.map_lng ? (
              <iframe
                src={`https://www.google.com/maps?q=${p.map_lat},${p.map_lng}&hl=en&z=14&output=embed`}
                title={`Map of ${p.name}`}
                loading="lazy"
                className="h-[380px] w-full rounded-2xl border border-border"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Location map coming soon.
              </div>
            )}
          </Section>

          <Section title="Calculators">
            <div className="grid gap-4 sm:grid-cols-2">
              <PriceCalculator defaultPrice={minPrice || 20000} />
              <EMICalculator defaultPrincipal={minPrice ? minPrice * 200 : 4000000} />
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div id="book" className="rounded-2xl bg-card p-6 shadow-luxe ring-1 ring-border">
            <h2 className="font-serif text-2xl font-semibold">Book a Site Visit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Complimentary transport from Hyderabad.
            </p>
            <SiteVisitForm projectId={p.id} />
          </div>
          <div className="mt-6 rounded-2xl bg-primary p-6 text-primary-foreground shadow-soft">
            <h3 className="font-serif text-xl font-semibold">Quick Enquiry</h3>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Prefer a callback? Drop your number and we'll ring you in 15 minutes.
            </p>
            <EnquiryForm projectId={p.id} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ruler;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <Icon className="h-4 w-4 text-accent" />
      <div className="mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-serif text-lg font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      className="mt-10"
    >
      <h2 className="font-serif text-2xl font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </motion.section>
  );
}

function AvailabilityBadge({ value }: { value: "available" | "reserved" | "sold" }) {
  const map: Record<typeof value, string> = {
    available: "bg-primary/10 text-primary",
    reserved: "bg-[color:var(--gold)]/20 text-[color:var(--gold)]",
    sold: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${map[value]}`}
    >
      {value}
    </span>
  );
}

function NearbyGroup({
  title,
  items,
}: {
  title: string;
  items: { name: string; distance: string }[];
}) {
  return (
    <div className="rounded-2xl bg-card p-4 ring-1 ring-border">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {items.map((it) => (
          <li key={it.name} className="flex items-center justify-between gap-3">
            <span>{it.name}</span>
            <span className="text-muted-foreground">{it.distance}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  return (
    <div className="container-luxe pt-6">
      <div className="grid gap-3 md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          <img
            src={images[active]}
            alt={`${name} — image ${active + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="grid grid-cols-4 gap-2 md:grid-cols-2">
          {images.slice(0, 4).map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] overflow-hidden rounded-lg ring-2 ${
                active === i ? "ring-primary" : "ring-transparent"
              }`}
            >
              <img
                src={src}
                alt={`${name} thumbnail ${i + 1}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function PriceCalculator({ defaultPrice }: { defaultPrice: number }) {
  const [area, setArea] = useState(240);
  const [price, setPrice] = useState(defaultPrice);
  const total = area * price;
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="font-serif text-lg font-semibold">Price Calculator</h3>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="text-muted-foreground">Area (sq.yd)</span>
          <input
            type="number"
            value={area}
            min={0}
            onChange={(e) => setArea(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Rate ₹/sq.yd</span>
          <input
            type="number"
            value={price}
            min={0}
            onChange={(e) => setPrice(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-primary/5 p-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Total value</div>
        <div className="mt-1 font-serif text-2xl font-semibold text-primary">{formatINR(total)}</div>
      </div>
    </div>
  );
}

function EMICalculator({ defaultPrincipal }: { defaultPrincipal: number }) {
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(10);
  const n = years * 12;
  const r = rate / 12 / 100;
  const emi = r === 0 ? principal / n : (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-border">
      <h3 className="font-serif text-lg font-semibold">EMI Calculator</h3>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <label className="text-sm">
          <span className="text-muted-foreground">Amount</span>
          <input
            type="number"
            value={principal}
            min={0}
            onChange={(e) => setPrincipal(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Rate %</span>
          <input
            type="number"
            value={rate}
            step="0.1"
            min={0}
            onChange={(e) => setRate(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="text-sm">
          <span className="text-muted-foreground">Years</span>
          <input
            type="number"
            value={years}
            min={1}
            max={30}
            onChange={(e) => setYears(Number(e.target.value) || 1)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-2 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>
      <div className="mt-4 rounded-xl bg-accent/10 p-3">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Monthly EMI</div>
        <div className="mt-1 font-serif text-2xl font-semibold text-accent">
          {formatINR(Math.round(emi))}
        </div>
      </div>
    </div>
  );
}

function SiteVisitForm({ projectId }: { projectId: string }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setSubmitting(true);
        try {
          await submitSiteVisit({
            data: {
              name: String(fd.get("name") ?? "").trim(),
              phone: String(fd.get("phone") ?? "").trim(),
              email: (String(fd.get("email") ?? "").trim() || undefined) as string | undefined,
              preferred_date: String(fd.get("preferred_date") ?? ""),
              preferred_time: String(fd.get("preferred_time") ?? "10:00 AM"),
              message: (String(fd.get("message") ?? "").trim() || undefined) as string | undefined,
              project_id: projectId,
            },
          });
          toast.success("Site visit booked! We'll call you to confirm.");
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
      className="mt-4 space-y-3"
    >
      <Input name="name" placeholder="Full name" required maxLength={100} />
      <Input name="phone" placeholder="Phone number" required type="tel" minLength={6} maxLength={20} />
      <Input name="email" placeholder="Email (optional)" type="email" maxLength={255} />
      <div className="grid grid-cols-2 gap-2">
        <Input
          name="preferred_date"
          type="date"
          required
          min={new Date().toISOString().split("T")[0]}
          icon={<Calendar className="h-4 w-4" />}
        />
        <select
          name="preferred_time"
          className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
          defaultValue="10:00 AM"
        >
          {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"].map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <textarea
        name="message"
        rows={2}
        placeholder="Anything specific? (optional)"
        maxLength={2000}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {submitting ? "Booking…" : "Book Site Visit"}
      </button>
    </form>
  );
}

function EnquiryForm({ projectId }: { projectId: string }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        setSubmitting(true);
        try {
          await submitEnquiry({
            data: {
              name: String(fd.get("name") ?? "").trim(),
              phone: String(fd.get("phone") ?? "").trim(),
              email: undefined,
              message: undefined,
              project_id: projectId,
            },
          });
          toast.success("We'll call you shortly.");
          form.reset();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setSubmitting(false);
        }
      }}
      className="mt-4 space-y-3"
    >
      <input
        name="name"
        placeholder="Your name"
        required
        maxLength={100}
        className="w-full rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-primary-foreground/50"
      />
      <input
        name="phone"
        type="tel"
        placeholder="Phone"
        required
        minLength={6}
        maxLength={20}
        className="w-full rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/60 outline-none focus:border-primary-foreground/50"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-primary-foreground py-3 text-sm font-medium text-primary transition-transform hover:scale-[1.01] disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Request Callback"}
      </button>
    </form>
  );
}

function Input({
  icon,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary ${icon ? "pl-9" : ""} ${className}`}
      />
    </div>
  );
}
