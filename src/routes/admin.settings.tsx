import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  ssr: false,
  head: () => ({ meta: [{ title: "Settings · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Settings">
      <SettingsPage />
    </AdminShell>
  ),
});

function SettingsPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setPw("");
    }
  };

  return (
    <div className="grid max-w-2xl gap-6">
      <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
        <h2 className="font-serif text-lg font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted-foreground">Signed in as</p>
        <p className="mt-1 font-medium">{email}</p>
      </div>

      <form onSubmit={changePw} className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
        <h2 className="font-serif text-lg font-semibold">Change password</h2>
        <input
          type="password"
          minLength={8}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="New password"
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          disabled={busy}
          className="mt-3 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>

      <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
        <h2 className="font-serif text-lg font-semibold">Security notes</h2>
        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Admin roles are stored in a separate <code>user_roles</code> table with RLS enforcement.</li>
          <li>The admin portal is not linked from the public website. Access requires the direct URL and a valid admin account.</li>
          <li>Only authenticated users with the admin role can create, edit or delete projects, plots and customer records.</li>
        </ul>
      </div>
    </div>
  );
}
