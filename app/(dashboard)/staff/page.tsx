import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { DeleteStaffButton } from "@/components/staff/DeleteStaffButton";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/"); // Or show an unauthorized error page
  }

  const staff = await db.user.findMany({
    include: { role: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
        <Link 
          href="/staff/new" 
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          <PlusCircle className="size-4" />
          Add Staff
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {staff.map((user) => (
              <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium text-card-foreground">{user.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {user.role.name}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.isActive ? (
                    <span className="text-green-600 font-medium text-xs">Active</span>
                  ) : (
                    <span className="text-red-600 font-medium text-xs">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/staff/${user.id}/edit`}
                      className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-secondary-foreground transition-colors"
                      title="Edit Staff"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>
                    </Link>
                    <DeleteStaffButton 
                      userId={user.id} 
                      disabled={user.id === session.user.id} 
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
