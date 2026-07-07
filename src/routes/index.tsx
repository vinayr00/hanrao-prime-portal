import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Award,
  Building2,
  ChevronDown,
  MapPin,
  Search,
  Shield,
  Sparkles,
  Star,
  TreePine,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { ProjectCard } from "@/components/ProjectCard";
import { listFeaturedProjects } from "@/lib/realty.functions";
import heroImg from "@/assets/hero.jpg";

const featuredQuery = {
  queryKey: ["projects", "featured"],
  queryFn: () => listFeaturedProjects(),
};

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(featuredQuery),
  head: () => ({
    meta: [
      { title: "HanRao Realty — Premium Open Plots in Hyderabad" },
      {
        name: "description",
        content:
          "Discover HMDA, DTCP and RERA approved open plots, villa plots and farm land in Hyderabad, Shamshabad, Sangareddy and Kompally.",
      },
      { property: "og:title", content: "HanRao Realty — Premium Open Plots" },
      {
        property: "og:description",
        content:
          "Curated premium plots across Hyderabad with full approvals and premium amenities.",
      },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProjects />
      <Amenities />
      <WhyUs />
      <Reviews />
      <FAQ />
      <CTA />
    </>
  );
}

function Hero() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Aerial view of a premium gated plotted community at golden hour"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background" />
      </div>
      <div className="container-luxe flex min-h-[86vh] flex-col items-center justify-center py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 bg-background/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" /> Premium Real Estate · Hyderabad
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: "easeOut" }}
          className="mt-6 max-w-4xl text-balance font-serif text-5xl font-semibold leading-[1.05] text-primary-foreground sm:text-6xl md:text-7xl"
        >
          Where your{" "}
          <span className="italic text-[color:var(--gold)]">next address</span>{" "}
          begins.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
          className="mt-5 max-w-2xl text-balance text-lg text-primary-foreground/90"
        >
          Curated HMDA, DTCP and RERA approved open plots, villa plots and farm land
          across Hyderabad's most sought-after locations.
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/search", search: { q: q.trim() || undefined } });
          }}
          className="mt-9 flex w-full max-w-2xl overflow-hidden rounded-full bg-background p-1.5 shadow-luxe ring-1 ring-primary-foreground/20"
        >
          <div className="flex flex-1 items-center gap-3 px-4">
            <Search className="h-5 w-5 shrink-0 text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Search by Location, Village, District or Project"
              className="w-full min-w-0 bg-transparent py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              maxLength={120}
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-8"
          >
            Search
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.6 }}
          className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-primary-foreground/80"
        >
          <span className="opacity-70">Popular:</span>
          {["Shamshabad", "Kompally", "Sangareddy", "Shankarpally", "Adibatla"].map((t) => (
            <Link
              key={t}
              to="/search"
              search={{ q: t }}
              className="rounded-full border border-primary-foreground/30 px-3 py-1 hover:bg-primary-foreground/10"
            >
              {t}
            </Link>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function TrustBar() {
  const stats = [
    { icon: Building2, label: "Premium Projects", value: "20+" },
    { icon: Users, label: "Happy Families", value: "500+" },
    { icon: Award, label: "Years of Trust", value: "12" },
    { icon: TrendingUp, label: "Avg. Appreciation", value: "18% p.a." },
  ];
  return (
    <section className="border-b border-border/60 bg-secondary/50 py-8">
      <div className="container-luxe grid grid-cols-2 gap-6 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="font-serif text-2xl font-semibold text-foreground">{s.value}</div>
              <div className="truncate text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function FeaturedProjects() {
  const { data } = useSuspenseQuery(featuredQuery);
  return (
    <section className="container-luxe py-20 md:py-24">
      <SectionHeading
        eyebrow="Featured"
        title="Signature Projects"
        subtitle="Handpicked communities where design, location and value converge."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
        >
          View all projects
        </Link>
      </div>
    </section>
  );
}

function Amenities() {
  const items = [
    { icon: Shield, title: "Gated Community", body: "24/7 security, CCTV surveillance and gated access." },
    { icon: TreePine, title: "Landscaped Gardens", body: "Lush parks, avenue plantations and open green spaces." },
    { icon: Building2, title: "Clubhouse", body: "Modern clubhouse with gym, pool and community hall." },
    { icon: MapPin, title: "Prime Locations", body: "Strategic addresses with excellent connectivity." },
    { icon: Award, title: "Full Approvals", body: "HMDA, DTCP and RERA approved layouts only." },
    { icon: TrendingUp, title: "High Appreciation", body: "Locations with proven long-term value growth." },
  ];
  return (
    <section className="bg-secondary/40 py-20 md:py-24">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Amenities"
          title="Thoughtfully crafted for you"
          subtitle="Every HanRao community is designed for the way modern families live."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border/60"
            >
              <div className="grid h-11 w-11 place-items-center rounded-full bg-accent/10 text-accent">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl font-semibold">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyUs() {
  const reasons = [
    { title: "Verified Legal Titles", body: "Every plot is title-verified with a full legal audit before listing." },
    { title: "Transparent Pricing", body: "Clear per-sq.yd pricing with no hidden fees. What you see is what you pay." },
    { title: "End-to-End Support", body: "From site visit to registration — our team walks with you every step." },
    { title: "Post-Sale Services", body: "Compound wall, boundary demarcation and construction referrals on request." },
  ];
  return (
    <section className="container-luxe py-20 md:py-24">
      <SectionHeading
        eyebrow="Why HanRao Realty"
        title="Trusted by families across Hyderabad"
        subtitle="Twelve years of curated real estate, delivered with integrity."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {reasons.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % 2) * 0.06 }}
            className="flex gap-4 rounded-2xl bg-card p-6 shadow-soft ring-1 ring-border/60"
          >
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-serif text-lg">
              {i + 1}
            </div>
            <div>
              <h3 className="font-serif text-xl font-semibold">{r.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Reviews() {
  const reviews = [
    {
      name: "Ramesh K.",
      city: "Shamshabad",
      text: "The team walked us through every step. Registration was smooth and our plot's value has already grown 30% in two years.",
    },
    {
      name: "Priya S.",
      city: "Kompally",
      text: "Transparent pricing and honest advice. We looked at three developers — HanRao was the clear choice.",
    },
    {
      name: "Anil Reddy",
      city: "Shankarpally",
      text: "Our Royal Meadows villa plot is exactly what was shown on the layout. Refreshing to work with builders you can trust.",
    },
  ];
  return (
    <section className="bg-primary py-20 text-primary-foreground md:py-24">
      <div className="container-luxe">
        <SectionHeading
          eyebrow="Testimonials"
          title="Kind words from our owners"
          subtitle="Nothing matters more than the trust of the families we serve."
          light
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {reviews.map((r, i) => (
            <motion.figure
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="rounded-2xl bg-primary-foreground/5 p-6 ring-1 ring-primary-foreground/15 backdrop-blur"
            >
              <div className="flex gap-0.5 text-[color:var(--gold)]">
                {Array.from({ length: 5 }).map((_, k) => (
                  <Star key={k} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 font-serif text-lg leading-snug">
                &ldquo;{r.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm text-primary-foreground/80">
                <span className="font-medium text-primary-foreground">{r.name}</span> · {r.city}
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const items = [
    {
      q: "What approvals do your plots carry?",
      a: "Every HanRao layout is HMDA, DTCP or RERA approved. Approval type is clearly listed on each project card and detail page.",
    },
    {
      q: "Can I book a site visit before purchasing?",
      a: "Yes — we strongly encourage it. Use the Book Site Visit button on any project page or contact us directly.",
    },
    {
      q: "Do you assist with loans and registration?",
      a: "We work with major banks for plot loans and handle the full registration process on your behalf.",
    },
    {
      q: "How do I know my title is clear?",
      a: "Every plot is title-verified with a full legal audit before listing. We share all documents openly.",
    },
    {
      q: "Which locations do you cover?",
      a: "Hyderabad, Shamshabad, Sangareddy, Kompally, Shankarpally, Adibatla, Patancheru, Yadagirigutta and more.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="container-luxe py-20 md:py-24">
      <SectionHeading
        eyebrow="FAQ"
        title="Answers, before you ask"
        subtitle="Common questions from families exploring plots with us."
      />
      <div className="mx-auto mt-10 max-w-3xl divide-y divide-border rounded-2xl bg-card shadow-soft ring-1 ring-border/60">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={it.q}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-serif text-lg font-semibold">{it.q}</span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5 text-sm text-muted-foreground">{it.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="container-luxe pb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-[color:var(--olive)] p-10 text-center text-primary-foreground shadow-luxe md:p-16">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[color:var(--gold)]/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-balance font-serif text-3xl font-semibold sm:text-4xl md:text-5xl">
            Ready to see your plot in person?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/85">
            Book a complimentary site visit — we'll arrange transport from Hyderabad.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-sm font-medium text-primary transition-transform hover:scale-[1.02]"
            >
              Browse Projects
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/40 px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-foreground/10"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`text-xs font-semibold uppercase tracking-[0.28em] ${light ? "text-[color:var(--gold)]" : "text-accent"}`}
      >
        {eyebrow}
      </div>
      <h2
        className={`mt-3 text-balance font-serif text-4xl font-semibold md:text-5xl ${light ? "text-primary-foreground" : "text-foreground"}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={`mx-auto mt-3 max-w-2xl text-balance text-base ${light ? "text-primary-foreground/80" : "text-muted-foreground"}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
