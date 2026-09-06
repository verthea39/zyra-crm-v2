export type {
  Client,
  CorporateProfile,
  IndividualProfile,
  Workflow,
  WorkflowStep,
  Task,
  Document,
  Quotation,
  Payment,
  User,
  Role,
} from "@prisma/client";

export {
  RoleName,
  ClientType,
  AccountStatus,
  StepStatus,
  TaskStatus,
  TaskVenue,
  DocumentCategory,
  DocumentVerificationStatus,
  IssuingAuthority,
} from "./enums";

/** Aggregate shape for the dashboard overview KPI cards. */
export interface DashboardMetrics {
  totalActiveCases: number;
  expiringNext30Days: number;
  expiringNext60Days: number;
  todaysFieldTasks: number;
  dailyRevenueAED: number;
}

/** Row shape for the expiring documents/licenses widget. */
export interface ExpiryAlertRow {
  id: string;
  clientId: string;
  clientName: string;
  category: string;
  label: string;
  expiryDate: string;
  tier: "EXPIRED" | "DUE_30" | "DUE_60" | "DUE_90";
}

/** Row shape for today's field PRO task list widget. */
export interface FieldTaskRow {
  id: string;
  title: string;
  venue: string;
  status: string;
  assigneeName: string;
  clientName: string;
  dueTime?: string;
  workflowId?: string;
}

/** Row shape for active PRO workflows widget. */
export interface ActiveWorkflowRow {
  id: string;
  name: string;
  clientName: string;
  totalSteps: number;
  completedSteps: number;
}
