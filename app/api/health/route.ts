import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/** Lightweight keep-alive / monitoring endpoint. Hitting this on a schedule
 * both catches DB reachability problems fast and helps keep the pooler's
 * connection to Postgres warm. */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "reachable", timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("GET /api/health: database unreachable:", error);
    return NextResponse.json(
      { status: "error", db: "unreachable", timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
