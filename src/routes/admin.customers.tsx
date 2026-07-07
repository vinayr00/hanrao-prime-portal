import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { listEnquiriesAdmin, listVisitsAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/customers")({
  ssr: false,
  head: () => ({ meta: [{ title: "Customers · Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: () => (
    <AdminShell title="Customers">
      <Customers />
    </AdminShell>
  ),
});

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  enquiries: any[];
  visits: any[];
  lastContact: string;
};

function Customers() {
  const enq = useQuery({ queryKey: ["admin", "enquiries"], queryFn: () => listEnquiriesAdmin() });
  const vis = useQuery({ queryKey: ["admin", "visits"], queryFn: () => listVisitsAdmin() });
  const [q, setQ] = useState("");

  const customers = useMemo<Customer[]>(() => {
    const map = new Map<string, Customer>();
    const push = (row: any, type: "enq" | "visit") => {
      const key = (row.phone || row.email || row.name).toLowerCase();
      const existing = map.get(key);
      const t = row.created_at ?? row.preferred_date ?? new Date().toISOString();
      if (existing) {
        if (type === "enq") existing.enquiries.push(row);
        else existing.visits.push(row);
        if (t > existing.lastContact) existing.lastContact = t;
      } else {
        map.set(key, {
          key,
          name: row.name,
          phone: row.phone,
          email: row.email ?? null,
          enquiries: type === "enq" ? [row] : [],
          visits: type === "visit" ? [row] : [],
          lastContact: t,
        });
      }
    };
    (enq.data ?? []).forEach((r: any) => push(r, "enq"));
    (vis.data ?? []).forEach((r: any) => push(r, "visit"));
    return [...map.values()].sort((a, b) => b.lastContact.localeCompare(a.lastContact));
  }, [enq.data, vis.data]);

  const filtered = customers.filter(
    (c) =>
      !q ||
      c.name?.toLowerCase().includes(q.toLowerCase()) ||
      c.phone?.includes(q) ||
      (c.email ?? "").toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full bg-card px-3 py-2 ring-1 ring-border">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Phone</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Enquiries</th>
              <th className="px-4 py-3 text-left">Visits</th>
              <th className="px-4 py-3 text-left">Last activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((c) => (
              <tr key={c.key}>
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3">{c.phone}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                <td className="px-4 py-3">{c.enquiries.length}</td>
                <td className="px-4 py-3">{c.visits.length}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.lastContact).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No customers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
