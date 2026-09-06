export type RoleName = "SUPER_ADMIN" | "OPERATIONS_MANAGER" | "PRO_AGENT" | "CLIENT_PORTAL";

/**
 * Central permission map for the four RBAC roles described in the spec:
 *  - SUPER_ADMIN: full visibility, financial analytics, revenue reports, user permissions
 *  - OPERATIONS_MANAGER: assign tasks to PROs, manage workflows, approve quotations
 *  - PRO_AGENT: view assigned field tasks, upload receipts/stamped documents, update refs
 *  - CLIENT_PORTAL: read-only — upload documents, track progress, view invoices, download deliverables
 */

export type Permission =
  | "clients:read"
  | "clients:write"
  | "companies:read"
  | "companies:write"
  | "workflows:read"
  | "workflows:write"
  | "workflows:assign"
  | "tasks:read:own"
  | "tasks:read:all"
  | "tasks:write:own"
  | "documents:read"
  | "documents:upload"
  | "documents:verify"
  | "invoices:read"
  | "invoices:write"
  | "quotations:read"
  | "quotations:approve"
  | "financials:view"
  | "users:manage";

const PERMISSIONS: Record<RoleName, Permission[]> = {
  SUPER_ADMIN: [
    "clients:read",
    "clients:write",
    "companies:read",
    "companies:write",
    "workflows:read",
    "workflows:write",
    "workflows:assign",
    "tasks:read:all",
    "tasks:write:own",
    "documents:read",
    "documents:upload",
    "documents:verify",
    "invoices:read",
    "invoices:write",
    "quotations:read",
    "quotations:approve",
    "financials:view",
    "users:manage",
  ],
  OPERATIONS_MANAGER: [
    "clients:read",
    "clients:write",
    "companies:read",
    "companies:write",
    "workflows:read",
    "workflows:write",
    "workflows:assign",
    "tasks:read:all",
    "documents:read",
    "documents:upload",
    "documents:verify",
    "invoices:read",
    "invoices:write",
    "quotations:read",
    "quotations:approve",
  ],
  PRO_AGENT: [
    "clients:read",
    "companies:read",
    "workflows:read",
    "tasks:read:own",
    "tasks:write:own",
    "documents:read",
    "documents:upload",
  ],
  CLIENT_PORTAL: [
    "documents:read",
    "documents:upload",
    "invoices:read",
    "workflows:read",
  ],
};

export function can(role: RoleName, permission: Permission): boolean {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

export function assertPermission(role: RoleName, permission: Permission) {
  if (!can(role, permission)) {
    throw new Error(`Forbidden: role ${role} lacks permission ${permission}`);
  }
}
