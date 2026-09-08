import { NextRequest, NextResponse } from "next/server";
import { requireSession, requirePermission } from "@/lib/session";
import { generateExport } from "@/lib/services/export.service";
import { format } from "date-fns";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    // Restrict export based on permission rather than raw role name
    await requirePermission("invoices:read");

    const { searchParams } = new URL(req.url);
    const scope = searchParams.get("scope") || "full";
    // We could parse other filters from URL here

    const buffer = await generateExport({ scope }, session.user.id);
    
    // File name: zyra-export-{scope}-{YYYY-MM-DD}.xlsx in Asia/Dubai
    const nowDubai = new Date().toLocaleString("en-US", { timeZone: "Asia/Dubai" });
    const formattedDate = format(new Date(nowDubai), "yyyy-MM-dd");
    const filename = `zyra-export-${scope}-${formattedDate}.xlsx`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    });

  } catch (error: any) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate export" }, { status: 500 });
  }
}
