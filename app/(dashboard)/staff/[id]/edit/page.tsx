import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { EditStaffForm } from "@/components/staff/EditStaffForm";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  if (session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: { role: true },
  });

  if (!user) {
    redirect("/staff");
  }

  return <EditStaffForm user={user} />;
}
