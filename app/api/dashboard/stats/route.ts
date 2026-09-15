import { NextResponse } from "next/server";
import { getDashboardCounts } from "@/lib/dashboardStats";

export const revalidate = 60;

export async function GET() {
  try {
    const counts = await getDashboardCounts();
    return NextResponse.json(counts);
  } catch (error) {
    console.error("GET /api/dashboard/stats failed:", error);
    return NextResponse.json(
      { criticalDocs: 0, medicalCases: 0, pendingCases: 0, lowBalanceWallets: 0, error: "database unreachable" },
      { status: 503 }
    );
  }
}
