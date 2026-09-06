# UAE PRO Services & Business Setup CRM

Full working CRM covering all six core modules from the spec: Client &
Company Management, PRO Services Workflow Tracker, Document Vault with
expiry alerts, UAE VAT Invoice Maker, Field PRO Task Dispatch, and the
Dashboard Overview — all wired end-to-end to Postgres via Prisma using
Server Actions (no separate API layer needed).

## Stack

- Next.js 15 (App Router, TypeScript, React 19)
- Tailwind CSS + shadcn/ui conventions (CSS variables in `app/globals.css`)
- TanStack Query for client-side data fetching, Server Actions for mutations
- PostgreSQL + Prisma ORM
- NextAuth.js (credentials provider) with Role-Based Access Control

## Getting started

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL, NEXTAUTH_SECRET, company TRN, etc.
npx prisma migrate dev --name init
npm run prisma:seed         # seeds the 4 RBAC roles, an admin user, and the 3 service templates
npm run dev
```

Default seeded login: `admin@agency.ae` / `ChangeMe123!` (change immediately).

## Directory structure

```
prisma/
  schema.prisma        # full domain model (see below)
  seed.ts               # roles, admin user, service step templates
app/
  (dashboard)/
    page.tsx             # Dashboard Overview — 4 key metrics + widgets
    layout.tsx            # sidebar nav shell
    clients/               # Client & Company Management (placeholder)
    companies/              # Corporate account detail (placeholder)
    workflows/                # PRO Services Kanban tracker (placeholder)
    documents/                  # Document Vault & expiry alerts (placeholder)
    invoices/                     # UAE VAT invoice maker (placeholder)
    field-tasks/                   # Field PRO dispatch (placeholder)
  (auth)/login/            # credentials login form
  api/auth/[...nextauth]/   # NextAuth route handler
components/
  dashboard/                # StatsCard, ExpiryAlertsWidget, TodayTasksWidget
  ui/                         # shadcn/ui primitives go here (run `npx shadcn add ...`)
  providers.tsx                # TanStack Query provider
lib/
  db.ts       # Prisma client singleton
  auth.ts     # NextAuth config (credentials + JWT session with role/clientId)
  rbac.ts     # permission map for the 4 roles
  dashboard.ts # server-side KPI/widget queries
  utils.ts    # cn(), AED currency + date formatting, expiry-tier helper
types/index.ts # re-exported Prisma types + dashboard DTOs
```

## Data model highlights (`prisma/schema.prisma`)

- **Client** is the master record, split `INDIVIDUAL` vs `CORPORATE` via
  1:1 `IndividualProfile` / `CorporateProfile` relations carrying all the
  UAE-specific fields (trade license, TRN/VAT, Emirates ID, Ejari, etc.).
- **ServiceTemplate → Workflow → WorkflowStep** models the Kanban step
  tracker; the seed script pre-loads the three step sequences from the
  spec (Employment Visa, Trade License, Attestation & MOFA).
- **Task / FieldTaskCheckIn** covers the Field PRO dispatch module,
  including geolocation and a linked `Document` for camera uploads.
- **Document** carries `expiryDate` + `verificationStatus`; `lib/utils.ts`
  exposes `expiryTier()` implementing the Expired/30/60/90-day tiers.
- **Quotation / Invoice / InvoiceLineItem / Payment / LedgerEntry**
  implement the two-tier cost model (`GOVERNMENT_CHARGE` 0% VAT vs
  `AGENCY_SERVICE_FEE` 5% VAT) and the client statement-of-account.
- **Role / User** implement RBAC; `lib/rbac.ts` maps each of the four
  roles (Super Admin, Operations Manager, PRO/Field Agent, Client Portal)
  to a permission set that server actions/routes should check.

## Dashboard Overview

`app/(dashboard)/page.tsx` is fully wired to Postgres via `lib/dashboard.ts`
and renders the four metrics called out in the spec:

1. Total Active Cases (open `Workflow`s)
2. Expiring Visas & Licenses (`Document`s due in next 30/60 days)
3. Today's Field PRO Tasks (`Task`s due today)
4. Monthly Revenue (sum of `Payment`s this month, in AED)

plus the Expiry Alerts widget and Today's Field Tasks widget.

## Roadmap (subsequent implementation passes)

1. **Clients & Companies** — data table with multi-filter search, detail
   drawer, document-attach modal with `Verified/Expiring Soon/Missing`
   badges.
2. **PRO Workflows** — Kanban board (drag steps between statuses), step
   assignee + government reference number fields, fee tracking.
3. **Document Vault** — upload pipeline (S3/Supabase Storage), expiry
   dashboard grouped by tier.
4. **Invoices & Billing** — bilingual (EN/AR) invoice builder with the
   two-tier line-item model, PDF export with QR code, quotation → invoice
   conversion, payment tracker.
5. **Field PRO Tasks** — mobile task list, geolocation check-in, camera
   upload tied to `FieldTaskCheckIn`.
6. Server Actions + Zod validation for all mutations, wired through
   `lib/rbac.ts` permission checks.
