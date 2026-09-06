"use server";

import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertPermission } from "@/lib/rbac";

export async function createServiceTemplateAction(prevState: any, formData: FormData) {
  let user;
  try {
    const session = await requireSession();
    user = session.user;
    assertPermission(user.role, "workflows:write");
  } catch {
    return { error: "Unauthorized." };
  }

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const basePriceStr = formData.get("basePrice") as string;
  const basePrice = basePriceStr ? parseFloat(basePriceStr) : null;

  // We need to parse dynamic step inputs. e.g. step_0_name, step_0_description, step_1_name
  const stepDefs: { name: string; description: string }[] = [];
  let i = 0;
  while (formData.has(`step_${i}_name`)) {
    const stepName = formData.get(`step_${i}_name`) as string;
    const stepDescription = formData.get(`step_${i}_description`) as string || "";
    if (stepName.trim()) {
      stepDefs.push({ name: stepName.trim(), description: stepDescription.trim() });
    }
    i++;
  }

  if (!name || !category) {
    return { error: "Name and Category are required." };
  }

  if (stepDefs.length === 0) {
    return { error: "At least one step is required." };
  }

  try {
    await db.serviceTemplate.create({
      data: {
        name,
        category: category.toUpperCase().replace(/\s+/g, '_'),
        description,
        basePrice,
        stepDefs: {
          create: stepDefs.map((step, index) => ({
            name: step.name,
            description: step.description,
            order: index + 1,
          })),
        },
      },
    });
  } catch (error: any) {
    console.error(error);
    return { error: "Failed to create service template." };
  }

  revalidatePath("/services");
  redirect("/services");
}

export async function deleteServiceTemplateAction(templateId: string) {
  let user;
  try {
    const session = await requireSession();
    user = session.user;
    assertPermission(user.role, "workflows:write");
  } catch {
    return { error: "Unauthorized" };
  }

  try {
    await db.serviceTemplate.delete({ where: { id: templateId } });
    revalidatePath("/services");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete service template." };
  }
}

export async function updateServiceTemplateAction(prevState: any, formData: FormData) {
  let user;
  try {
    const session = await requireSession();
    user = session.user;
    assertPermission(user.role, "workflows:write");
  } catch {
    return { error: "Unauthorized" };
  }

  const templateId = formData.get("templateId") as string;
  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const description = formData.get("description") as string;
  const basePriceStr = formData.get("basePrice") as string;
  const basePrice = basePriceStr ? parseFloat(basePriceStr) : null;

  const stepDefs: { name: string; description: string }[] = [];
  let i = 0;
  while (formData.has(`step_${i}_name`)) {
    const stepName = formData.get(`step_${i}_name`) as string;
    const stepDescription = formData.get(`step_${i}_description`) as string || "";
    if (stepName.trim()) {
      stepDefs.push({ name: stepName.trim(), description: stepDescription.trim() });
    }
    i++;
  }

  if (!templateId || !name || !category) {
    return { error: "Name and Category are required." };
  }

  if (stepDefs.length === 0) {
    return { error: "At least one step is required." };
  }

  try {
    // Delete old steps and recreate them
    await db.$transaction([
      db.serviceStepDef.deleteMany({ where: { templateId } }),
      db.serviceTemplate.update({
        where: { id: templateId },
        data: {
          name,
          category: category.toUpperCase().replace(/\s+/g, '_'),
          description,
          basePrice,
          stepDefs: {
            create: stepDefs.map((step, index) => ({
              name: step.name,
              description: step.description,
              order: index + 1,
            })),
          },
        },
      }),
    ]);
  } catch (error) {
    console.error(error);
    return { error: "Failed to update service template." };
  }

  revalidatePath("/services");
  redirect("/services");
}
