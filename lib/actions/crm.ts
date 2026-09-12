"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createLead(data: any) {
  const lead = await prisma.lead.create({ data });
  revalidatePath("/pipeline");
  return lead;
}

export async function updateLead(id: string, data: any) {
  const lead = await prisma.lead.update({ where: { id }, data });
  revalidatePath("/pipeline");
  return lead;
}

export async function createDeal(data: any) {
  const deal = await prisma.deal.create({ data });
  revalidatePath("/pipeline");
  return deal;
}

export async function updateDealStage(id: string, stage: string) {
  const deal = await prisma.deal.update({ where: { id }, data: { stage } });
  revalidatePath("/pipeline");
  return deal;
}

export async function createActivity(data: any) {
  const activity = await prisma.activity.create({ data });
  revalidatePath("/clients/[id]", "page");
  return activity;
}
