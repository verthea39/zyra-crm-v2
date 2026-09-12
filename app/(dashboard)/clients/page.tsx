import Link from "next/link";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { listClientsPaginated } from "@/lib/actions/clients";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export type AccountStatus = "ACTIVE" | "PROSPECT" | "INACTIVE" | "ARCHIVED";
export type ClientType = "CORPORATE" | "INDIVIDUAL";

const statusTone: Record<AccountStatus, "success" | "warning" | "muted" | "destructive"> = {
  ACTIVE: "success",
  PROSPECT: "warning",
  INACTIVE: "muted",
  ARCHIVED: "destructive",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: ClientType; status?: AccountStatus; page?: string }>;
}) {
  const { q, type, status, page } = await searchParams;
  const currentPage = Number(page) || 1;
  const { clients, totalPages, totalCount } = await listClientsPaginated({ query: q, clientType: type, status, page: currentPage, pageSize: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Individual & corporate client master records.
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4" /> New Client
          </Button>
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder="Search by name…" className="pl-9" />
        </div>
        <Select name="type" defaultValue={type ?? ""} className="w-44">
          <option value="">All types</option>
          <option value="CORPORATE">Corporate</option>
          <option value="INDIVIDUAL">Individual</option>
        </Select>
        <Select name="status" defaultValue={status ?? ""} className="w-44">
          <option value="">All statuses</option>
          <option value="PROSPECT">Prospect</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="overflow-x-auto overflow-y-hidden rounded-lg border border-border bg-card">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Key reference</th>
              <th className="px-4 py-3">Assigned PRO</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Added</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No clients match these filters.
                </td>
              </tr>
            )}
            {clients.map((client) => {
              const name =
                client.corporateProfile?.companyNameEn ??
                client.individualProfile?.fullNameEn ??
                "—";
              const reference =
                client.corporateProfile?.tradeLicenseNumber ??
                client.individualProfile?.passportNumber ??
                "—";

              return (
                <tr key={client.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/clients/${client.id}`} className="font-medium text-primary hover:underline">
                      {name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.clientType}</td>
                  <td className="px-4 py-3 text-muted-foreground">{reference}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {client.assignedPRO?.name ?? "Unassigned"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[client.accountStatus as AccountStatus]}>{client.accountStatus}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(client.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing page {currentPage} of {totalPages} ({totalCount} total clients)
          </p>
          <div className="flex items-center space-x-2">
            {currentPage <= 1 ? (
              <Button variant="outline" size="sm" disabled>
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
            ) : (
              <Link href={`/clients?q=${q || ""}&type=${type || ""}&status=${status || ""}&page=${currentPage - 1}`} className="inline-flex h-7 items-center justify-center rounded-[12px] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground">
                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
              </Link>
            )}
            {currentPage >= totalPages ? (
              <Button variant="outline" size="sm" disabled>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Link href={`/clients?q=${q || ""}&type=${type || ""}&status=${status || ""}&page=${currentPage + 1}`} className="inline-flex h-7 items-center justify-center rounded-[12px] border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted hover:text-foreground">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
