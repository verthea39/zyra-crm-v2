import prisma from "@/lib/prisma";
import type { CurrentUser } from "@/lib/currentUserHelpers";

export type { CurrentUser };

const FALLBACK_USER: CurrentUser = { name: "Admin User", email: "admin@zyrabusinesshub.com", role: "ADMIN" };

/**
 * This app has no login/session system -- there is no cookie or token that
 * identifies "who is browsing" (see UserMenuPopover.tsx). Until real auth
 * exists, the sidebar profile shows the primary active admin account from
 * the User table (oldest ADMIN/SUPER_ADMIN, falling back to any active user)
 * instead of a hardcoded string, so it at least reflects real seeded data.
 * It is NOT a per-visitor session -- every browser sees the same profile.
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  try {
    const user =
      (await prisma.user.findFirst({
        where: { isActive: true, role: { in: ["ADMIN", "SUPER_ADMIN"] } },
        orderBy: { createdAt: "asc" },
        select: { name: true, email: true, role: true },
      })) ||
      (await prisma.user.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
        select: { name: true, email: true, role: true },
      }));

    if (!user) return FALLBACK_USER;
    return user;
  } catch (err) {
    console.error("Failed to load current user, using fallback:", err);
    return FALLBACK_USER;
  }
}
