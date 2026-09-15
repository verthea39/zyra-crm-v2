import { getCases } from "@/app/actions/pipeline";
import { getCorporateClients } from "@/app/actions/b2b"; // Using this to fetch clients for the dropdown, though we should probably fetch all clients.
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";
import { PipelineClientView } from "@/components/pipeline/PipelineClientView";


export const dynamic = "force-dynamic";
async function getAllClients() {
  return await prisma.client.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });
}

async function getCoordinators() {
  // "Coordinator" here means anyone eligible to be assigned a case, not
  // literally role === COORDINATOR -- that filter left the dropdown empty
  // whenever staff were seeded under ADMIN/PRO_SPECIALIST/etc, which made
  // the Assigned PRO select look broken (nothing to pick, so nothing to
  // click). Include every case-eligible role, and if for some reason none
  // exist yet, fall back to every active user rather than an empty list.
  const eligibleRoles: Role[] = ['ADMIN', 'SUPER_ADMIN', 'COORDINATOR', 'PRO_SPECIALIST'];

  const eligible = await prisma.user.findMany({
    where: { role: { in: eligibleRoles }, isActive: true },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });

  if (eligible.length > 0) return eligible;

  return prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}

export default async function PipelinePage() {
  const cases = await getCases();
  const clients = await getAllClients();
  const coordinators = await getCoordinators();

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#16181D]">
      <PipelineClientView 
        initialCases={cases} 
        clients={clients} 
        coordinators={coordinators} 
      />
    </div>
  );
}
