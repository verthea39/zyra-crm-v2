import { getCases } from "@/app/actions/pipeline";
import { getCorporateClients } from "@/app/actions/b2b"; // Using this to fetch clients for the dropdown, though we should probably fetch all clients.
import prisma from "@/lib/prisma";
import { PipelineClientView } from "@/components/pipeline/PipelineClientView";

async function getAllClients() {
  return await prisma.client.findMany({
    select: { id: true, name: true, type: true },
    orderBy: { name: 'asc' }
  });
}

async function getCoordinators() {
  return await prisma.user.findMany({
    where: { role: 'COORDINATOR' },
    select: { id: true, name: true }
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
