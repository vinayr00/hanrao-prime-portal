import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Ruler, ShieldCheck } from "lucide-react";
import { formatPricePerSqYd } from "@/lib/site";
import type { Project } from "@/lib/types";

type Props = {
  project: Project & { _minPrice?: number; _availableCount?: number; _plotCount?: number };
  index?: number;
};

export function ProjectCard({ project, index = 0 }: Props) {
  const minPrice = project._minPrice ?? 0;
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.08, ease: "easeOut" }}
      className="group flex flex-col overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-luxe"
    >
      <Link to="/projects/$slug" params={{ slug: project.slug }} className="block overflow-hidden">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          <img
            src={project.thumbnail_url}
            alt={project.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {project.approval_types.map((a) => (
              <span
                key={a}
                className="rounded-full bg-background/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary"
              >
                {a}
              </span>
            ))}
          </div>
          {project.status === "upcoming" && (
            <span className="absolute right-3 top-3 rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
              Upcoming
            </span>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-serif text-2xl font-semibold text-foreground">{project.name}</h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {[project.village, project.district].filter(Boolean).join(", ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {minPrice > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground">
              <Ruler className="h-3.5 w-3.5 text-accent" /> {formatPricePerSqYd(minPrice)}
            </span>
          )}
          {project._availableCount !== undefined && (
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              {project._availableCount} available
            </span>
          )}
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <Link
            to="/projects/$slug"
            params={{ slug: project.slug }}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View Details
          </Link>
          <Link
            to="/projects/$slug"
            params={{ slug: project.slug }}
            hash="book"
            className="inline-flex flex-1 items-center justify-center rounded-full border border-primary/30 bg-transparent px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
          >
            Book Visit
          </Link>
        </div>
      </div>
    </motion.article>
  );
}
