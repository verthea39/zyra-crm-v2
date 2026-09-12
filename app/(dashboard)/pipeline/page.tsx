import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/dashboard/crm/KanbanBoard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const deals = await prisma.deal.findMany({
    include: {
      client: {
        include: {
          corporateProfile: true,
          individualProfile: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Deal Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Manage your sales pipeline and track deal stages.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/leads">
            <Button variant="outline">View Leads</Button>
          </Link>
          <Link href="/pipeline/new">
            <Button>
              <Plus className="mr-2 size-4" />
              New Deal
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1">
        <KanbanBoard initialDeals={deals} />
      </div>
    </div>
  );
}
