import { useState } from "react";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const YEAR_10 = 60 * 60 * 24 * 365 * 10;

async function uploadOne(bucket: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from(bucket).createSignedUrl(path, YEAR_10);
  if (sErr) throw sErr;
  return data.signedUrl;
}

export function ImageUploadField({
  label,
  bucket = "project-images",
  multiple = false,
  value,
  onChange,
}: {
  label: string;
  bucket?: string;
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await uploadOne(bucket, f));
      onChange(multiple ? [...value, ...urls] : [urls[0]]);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {value.map((u, i) => (
          <div key={u + i} className="relative h-20 w-28 overflow-hidden rounded-lg ring-1 ring-border">
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute right-1 top-1 rounded-full bg-background/90 p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs text-muted-foreground hover:border-primary">
          <Upload className="h-4 w-4" />
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept="image/*"
            multiple={multiple}
            className="hidden"
            onChange={(e) => handle(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}

export function FileUploadField({
  label,
  bucket = "project-brochures",
  value,
  onChange,
  accept = "application/pdf",
}: {
  label: string;
  bucket?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const handle = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const url = await uploadOne(bucket, files[0]);
      onChange(url);
      toast.success("Uploaded");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex items-center gap-2">
        {value && (
          <a href={value} target="_blank" rel="noreferrer" className="truncate text-xs text-primary underline">
            View current file
          </a>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            Remove
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs hover:border-primary">
          <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Choose file"}
          <input type="file" accept={accept} className="hidden" onChange={(e) => handle(e.target.files)} />
        </label>
      </div>
    </div>
  );
}
