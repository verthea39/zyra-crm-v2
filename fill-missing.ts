import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

async function main() {
  const templates = await db.serviceTemplate.findMany({
    include: { stepDefs: true },
  });

  for (const template of templates) {
    if (!template.description || template.stepDefs.length === 0) {
      const description = template.description || `Standard processing for ${capitalize(template.name)}.`;
      
      const updateData: any = { description };

      if (template.stepDefs.length === 0) {
        updateData.stepDefs = {
          create: [
            {
              order: 1,
              name: capitalize(template.name),
              description: `Complete the ${capitalize(template.name)} process.`,
            },
          ],
        };
      } else {
        // Update steps to have description if missing
        for (const step of template.stepDefs) {
          if (!step.description) {
            await db.serviceStepDef.update({
              where: { id: step.id },
              data: { description: `Execute ${step.name}` },
            });
          }
        }
      }

      await db.serviceTemplate.update({
        where: { id: template.id },
        data: updateData,
      });

      console.log(`Updated template: ${template.name}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
