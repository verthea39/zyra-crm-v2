import { getCases } from "@/app/actions/pipeline";
import prisma from "@/lib/prisma";
import { logServerError } from "@/lib/logger";
import { Role } from "@prisma/client";
import { PipelineClientView } from "@/components/pipeline/PipelineClientView";


export const dynamic = "force-dynamic";
async function getAllClients() {
  try {
    return await prisma.client.findMany({
      select: { id: true, name: true, type: true },
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    logServerError(err, { action: "getAllClients" });
    return [];
  }
}

async function getCoordinators() {
  // "Coordinator" here means anyone eligible to be assigned a case, not
  // literally role === COORDINATOR -- that filter left the dropdown empty
  // whenever staff were seeded under ADMIN/PRO_SPECIALIST/etc, which made
  // the Assigned PRO select look broken (nothing to pick, so nothing to
  // click). Include every case-eligible role, and if for some reason none
  // exist yet, fall back to every active user rather than an empty list.
  const eligibleRoles: Role[] = ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PRO_SPECIALIST'];

  try {
    const eligible = await prisma.user.findMany({
      where: { role: { in: eligibleRoles }, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    if (eligible.length > 0) return eligible;

    return await prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  } catch (err) {
    logServerError(err, { action: "getCoordinators" });
    return [];
  }
}

export default async function PipelinePage() {
  const [cases, clients, coordinators] = await Promise.all([
    getCases(),
    getAllClients(),
    getCoordinators(),
  ]);

  const dbError = cases.length === 0 && clients.length === 0 && coordinators.length === 0;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#16181D]">
      {dbError && (
        <div className="m-4 mb-0 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-medium">
          Unable to sync data right now. It should recover automatically -- refresh in a moment.
        </div>
      )}
      <PipelineClientView
        initialCases={cases}
        clients={clients}
        coordinators={coordinators}
      />
    </div>
  );
}
