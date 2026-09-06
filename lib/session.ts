import { createSupabaseContext } from "@/lib/supabase/context";
import { db } from "@/lib/db";
import { assertPermission, type Permission, type RoleName } from "@/lib/rbac";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: RoleName;
  clientId?: string | null;
};

export class UnauthorizedError extends Error {
  constructor(message = "You must be signed in to do this.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You do not have permission to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export async function requireSession() {
  const { data, error } = await createSupabaseContext();
  if (error || !data) throw new UnauthorizedError();

  const userEmail = data.jwtClaims?.email;
  if (!userEmail) throw new UnauthorizedError();

  const user = await db.user.findUnique({
    where: { email: userEmail as string },
    include: { role: true },
  });

  if (!user || !user.isActive) throw new UnauthorizedError();

  const sessionUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.name as RoleName,
    clientId: user.clientId,
  };

  return { user: sessionUser };
}

/** Throws unless the signed-in user's role has the given permission. */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  try {
    assertPermission(session.user.role, permission);
  } catch {
    throw new ForbiddenError();
  }
  return session;
}
