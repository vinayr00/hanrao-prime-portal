import { Phone } from "lucide-react";
import { SITE } from "@/lib/site";

export function FloatingActions() {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col gap-3">
      <a
        href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
          "Hi HanRao Realty, I'm interested in your plots.",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="group grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-luxe transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current" aria-hidden="true">
          <path d="M19.11 17.21c-.28-.14-1.66-.82-1.92-.91-.26-.09-.45-.14-.63.14-.19.28-.72.9-.88 1.09-.16.19-.32.21-.6.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.44.12-.58.13-.13.28-.32.42-.49.14-.16.19-.28.28-.47.09-.19.05-.35-.02-.49-.07-.14-.63-1.52-.87-2.08-.23-.55-.46-.47-.63-.48h-.54c-.19 0-.49.07-.75.35s-.99.97-.99 2.36.99 2.74 1.13 2.93c.14.19 1.95 2.98 4.72 4.18.66.28 1.18.45 1.58.58.66.21 1.26.18 1.74.11.53-.08 1.66-.68 1.89-1.34.23-.66.23-1.22.16-1.34-.07-.12-.26-.19-.54-.33ZM16 3.2A12.8 12.8 0 0 0 4.62 22.02L3.2 28.8l6.98-1.4A12.8 12.8 0 1 0 16 3.2Zm0 23.31a10.5 10.5 0 0 1-5.35-1.46l-.38-.23-4.14.83.83-4.04-.25-.4A10.5 10.5 0 1 1 16 26.51Z" />
        </svg>
      </a>
      <a
        href={`tel:${SITE.phoneE164}`}
        aria-label="Call HanRao Realty"
        className="grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground shadow-luxe transition-transform hover:scale-105"
      >
        <Phone className="h-6 w-6" />
      </a>
    </div>
  );
}
