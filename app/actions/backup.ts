"use server";

import { db as prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/session";

export async function exportDatabase() {
  try {
    await requirePermission("users:manage");
    // Fetch all records from all tables
    const data = {
      roles: await prisma.role.findMany(),
      users: await prisma.user.findMany(),
      clients: await prisma.client.findMany(),
      corporateProfiles: await prisma.corporateProfile.findMany(),
      individualProfiles: await prisma.individualProfile.findMany(),
      serviceTemplates: await prisma.serviceTemplate.findMany(),
      serviceStepDefs: await prisma.serviceStepDef.findMany(),
      workflows: await prisma.workflow.findMany(),
      workflowSteps: await prisma.workflowStep.findMany(),
      tasks: await prisma.task.findMany(),
      documents: await prisma.document.findMany(),
      fieldTaskCheckIns: await prisma.fieldTaskCheckIn.findMany(),

      quotations: await prisma.quotation.findMany(),
      quotationLineItems: await prisma.quotationLineItem.findMany(),
      payments: await prisma.payment.findMany(),

      auditLogs: await prisma.auditLog.findMany(),
    };

    return { success: true, data: JSON.stringify(data) };
  } catch (error: any) {
    console.error("Export Error:", error);
    return { success: false, error: error.message };
  }
}

export async function importDatabase(jsonString: string) {
  try {
    await requirePermission("users:manage");
    const data = JSON.parse(jsonString);

    await prisma.$transaction(
      async (tx) => {
        // 1. Delete all existing data in reverse dependency order
        await tx.auditLog.deleteMany();

        await tx.payment.deleteMany();

        await tx.quotationLineItem.deleteMany();

        
        await tx.fieldTaskCheckIn.deleteMany();
        await tx.task.deleteMany();
        await tx.workflowStep.deleteMany();
        await tx.workflow.deleteMany();
        await tx.serviceStepDef.deleteMany();
        await tx.serviceTemplate.deleteMany();
        
        await tx.document.deleteMany();
        await tx.individualProfile.deleteMany();
        await tx.corporateProfile.deleteMany();

        // Break cyclic User <-> Client relation
        // We use queryRaw or just try to update because relation name might be missing, 
        // wait, portalUser is a relation but the field is clientId on User. 
        // User has clientId. Client has assignedPROId.
        await tx.client.updateMany({ data: { assignedPROId: null } });
        await tx.user.updateMany({ data: { clientId: null } });

        await tx.client.deleteMany();
        await tx.user.deleteMany();
        await tx.role.deleteMany();

        // 2. Insert data in dependency order
        if (data.roles?.length) await tx.role.createMany({ data: data.roles });
        
        // Remove clientId from users temporarily
        const usersToInsert = data.users?.map((u: any) => ({ ...u, clientId: null })) || [];
        if (usersToInsert.length) await tx.user.createMany({ data: usersToInsert });

        // Remove assignedPROId from clients temporarily
        const clientsToInsert = data.clients?.map((c: any) => ({ ...c, assignedPROId: null })) || [];
        if (clientsToInsert.length) await tx.client.createMany({ data: clientsToInsert });

        // Restore Client <-> User relationships
        for (const u of data.users || []) {
          if (u.clientId) {
            await tx.user.update({ where: { id: u.id }, data: { clientId: u.clientId } });
          }
        }
        for (const c of data.clients || []) {
          if (c.assignedPROId) {
            await tx.client.update({ where: { id: c.id }, data: { assignedPROId: c.assignedPROId } });
          }
        }

        if (data.corporateProfiles?.length) await tx.corporateProfile.createMany({ data: data.corporateProfiles });
        if (data.individualProfiles?.length) await tx.individualProfile.createMany({ data: data.individualProfiles });
        
        if (data.serviceTemplates?.length) await tx.serviceTemplate.createMany({ data: data.serviceTemplates });
        if (data.serviceStepDefs?.length) await tx.serviceStepDef.createMany({ data: data.serviceStepDefs });
        
        if (data.workflows?.length) await tx.workflow.createMany({ data: data.workflows });
        if (data.workflowSteps?.length) await tx.workflowStep.createMany({ data: data.workflowSteps });
        if (data.tasks?.length) await tx.task.createMany({ data: data.tasks });
        
        if (data.documents?.length) await tx.document.createMany({ data: data.documents });
        if (data.fieldTaskCheckIns?.length) await tx.fieldTaskCheckIn.createMany({ data: data.fieldTaskCheckIns });
        

        
        if (data.quotations?.length) await tx.quotation.createMany({ data: data.quotations });
        
        if (data.quotationLineItems?.length) await tx.quotationLineItem.createMany({ data: data.quotationLineItems });
        
        if (data.payments?.length) await tx.payment.createMany({ data: data.payments });

        if (data.auditLogs?.length) await tx.auditLog.createMany({ data: data.auditLogs });
      },
      {
        maxWait: 10000, // 10 seconds
        timeout: 60000, // 60 seconds
      }
    );

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Import Error:", error);
    return { success: false, error: error.message || "Failed to restore database from backup." };
  }
}
