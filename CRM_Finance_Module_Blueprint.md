# CRM Finance Module Blueprint

**CRM Extension · Domain & System Architecture**
Draft v1 · 2026-09-10

A complete design for the money side of your CRM — from a client's first quotation
through invoices, receipts, the double-entry ledger, receivables ageing, and a live P&L.
Built for a Node.js + PostgreSQL service with manual and bank-statement reconciliation,
no payment gateway required.

| Aspect | Choice |
| --- | --- |
| Stack | NestJS · PostgreSQL 15 · Prisma (domain model is stack-agnostic) |
| Payments | Manual / bank-only |
| Accounting | Double-entry, accrual |
| Pattern | Modular monolith |
| Version | Draft v1 · 2026-09-10 |

> **Note on the host project (Zyra CRM):** this repo is a Next.js + Prisma app. The
> module boundaries, ERD, ledger rules, and API surface below map cleanly onto Next.js
> route handlers + Prisma models; "NestJS service" can be read as "a `/finance` module
> folder with its own services and Prisma schema section".

---

## Contents

1. [Overview & principles](#1-overview--principles)
2. [Module map](#2-module-map)
3. [Domain model & ERD](#3-domain-model--erd)
4. [The ledger & postings](#4-the-ledger--postings)
5. [Document lifecycle](#5-document-lifecycle)
6. [Bank reconciliation](#6-bank-reconciliation)
7. [Reports & dashboard](#7-reports--dashboard)
8. [API surface](#8-api-surface)
9. [Services & background jobs](#9-services--background-jobs)
10. [CRM integration](#10-crm-integration)
11. [Security, tax & roadmap](#11-security-tax--roadmap)

---

## 1. Overview & principles

The finance module is a bounded context inside the CRM. The CRM owns *people and
pipeline*; the finance module owns *agreements and money*. They meet at two shared
entities — the **Client** (an accounting-augmented view of a CRM account) and the
**Deal** (which a quotation can be raised against).

### Design principles

- **One immutable ledger is the source of truth.** Every figure on every report is
  derived by aggregating `journal_entries`. Balances are never stored as editable
  columns; they are projections.
- **Documents are append-only once issued.** A sent invoice is never edited — it is
  superseded by a credit note or a new revision. This keeps audit trails and
  sequential numbering intact.
- **Money is integer minor units.** Store `amount_minor BIGINT` + `currency CHAR(3)`.
  Never floats. A `Money` value object handles arithmetic and rounding (banker's
  rounding, half-up configurable).
- **Accrual first, cash visible.** Revenue is recognised when an invoice is issued;
  cash movement is a separate event. Both accrual P&L and cash-basis views fall out of
  the same data.
- **Every state change is an event.** Domain events (`InvoiceIssued`, `PaymentReceived`,
  `InvoiceOverdue`) drive ledger postings, notifications, and CRM timeline updates.

### Vocabulary

- **Income** = all money earned (operating revenue + other income).
- **Revenue** = income from core business activity, recognised on invoice issue.
- **Receivable** = an issued invoice not yet fully paid.
- **Outstanding Due** = sum of open receivables (customers owe you).
- **Outstanding Payable** = sum of open bills (you owe suppliers).
- **Net Profit** = Revenue + Other income − COGS − Operating expenses − Tax, over a period.

---

## 2. Module map

Ship as a modular monolith: separate modules with their own services and Prisma models,
communicating through an in-process event bus and typed service interfaces. Any module
can later be extracted to its own service because none reads another's tables directly.

| Module | ID | Purpose | Depends on |
| --- | --- | --- | --- |
| Clients | FIN-CLI | Billing profile over a CRM account: legal name, tax IDs, billing address, payment terms, credit limit, currency, AR contacts. | CRM Accounts |
| Products & Price Book | FIN-CAT | Sellable items/services, unit price, tax category, default income account, optional cost for margin. | standalone |
| Quotations | FIN-QUO | Draft → Sent → Accepted/Declined/Expired. Versioned. Converts to an invoice or a project. | Clients, Catalog, Deals |
| Invoices | FIN-INV | AR documents. Line items, tax, discounts, due date from terms. Issue posts to the ledger. Part-payment, credit notes, recurring schedules. | Quotations, Ledger |
| Receipts & Payments | FIN-PAY | Records money in (customer receipts) and money out (supplier payments). Allocation engine matches a receipt to one or more invoices. | Invoices, Bills, Ledger |
| Bills / Payables | FIN-BIL | Supplier invoices you owe. Mirror of Invoices on the AP side. Drives Outstanding Payable. | Vendors, Ledger |
| Expenses | FIN-EXP | Direct spend without a formal bill: receipts, mileage, reimbursements, card charges. Category = expense account. | Ledger |
| Ledger & Chart of Accounts | FIN-LDG | Double-entry core. Accounts, journals, journal entries. Every other module posts here; nothing edits it. | standalone core |
| Bank & Reconciliation | FIN-BNK | Bank accounts, statement import (CSV/OFX/MT940), transaction matching, reconciliation status. | Ledger, Payments |
| Transactions | FIN-TXN | Unified read-model / feed of every money event across modules for search, filter, export. | projection |
| Tax | FIN-TAX | Tax rates, rules, jurisdictions; computes line and document tax; tax payable/receivable report. | Catalog, Invoices |
| Reporting | FIN-RPT | P&L, Balance Sheet, AR/AP Ageing, Cash flow, Revenue analytics. Read-only aggregation over the ledger. | Ledger, Transactions |
| Finance Dashboard | FIN-DSH | KPI tiles, trend sparklines, ageing summary, cash position, recent activity — the landing screen. | Reporting |
| Numbering & Documents | FIN-DOC | Gap-free sequential numbers per doc type per year; PDF rendering; templates; delivery log. | cross-cutting |

---

## 3. Domain model & ERD

Grey entities live in the CRM; green entities are owned by the finance module.

```
        ┌──────────────┐        ┌──────────────┐
        │  CRM Account │        │     Deal     │        (CRM-owned, dashed)
        └──────┬───────┘        └──────┬───────┘
               │ augments              │ raised on
        ┌──────▼───────┐               │
        │    Client    │◄──────────────┤
        │ tax id·terms │   bills to    │
        │ currency     │        ┌──────▼───────┐        ┌──────────────┐
        └──────────────┘        │  Quotation   │        │   Product    │
                                │ status       │        │ price·cost   │
                                │ valid_until  │        │ tax_category │
                                └──────┬───────┘        └──────┬───────┘
                                       │ converts to           │ references
        ┌──────────────┐        ┌──────▼───────┐        ┌──────▼───────┐
        │ Bill (Payable)│  AP    │   Invoice    │───has──►│  Line Item   │
        │ vendor·due    │ mirror │ number·dates │        │ qty·price    │
        │ status·balance│◄───────│ status·bal   │        │ tax·account  │
        └──────┬───────┘        └──────┬───────┘        └──────────────┘
               │                       │ settled by
               │                ┌──────▼───────┐        ┌──────────────┐
               │                │   Payment    │─splits─►│  Allocation  │
               │                │ direction    │  into   │ amount_minor │
               │                │ method·date  │        └──────────────┘
               │                └──────┬───────┘
               │ posts                 │ posts (and Invoice posts on issue)
        ┌──────▼───────────────────────▼───────┐        ┌──────────────┐
        │           Journal Entry              │◄───────│ Account (CoA)│
        │ date · source_type/id                │ debited│ code · type  │
        │ lines[] (debit/credit)               │credited│ asset/liab/… │
        │ Σ debit = Σ credit                   │        └──────────────┘
        └──────────────────────────────────────┘
                       ▲ matches
        ┌──────────────┴───────┐
        │  Bank Transaction    │
        │ stmt date · memo     │
        │ matched_payment_id   │
        └──────────────────────┘
```

### Key tables

| Table | Purpose | Notable columns |
| --- | --- | --- |
| `clients` | Billing entity over a CRM account | `crm_account_id`, `legal_name`, `tax_number`, `payment_terms_days`, `credit_limit_minor`, `default_currency`, `ar_contact_id` |
| `quotations` | Priced offer, versioned | `number`, `client_id`, `deal_id`, `status`, `valid_until`, `version`, `subtotal_minor`, `tax_minor`, `total_minor` |
| `quotation_lines` / `invoice_lines` / `bill_lines` | Document line items | `description`, `product_id`, `quantity`, `unit_price_minor`, `discount_pct`, `tax_rate_id`, `income_account_id` |
| `invoices` | AR document | `number`, `client_id`, `quotation_id`, `issue_date`, `due_date`, `status`, `total_minor`, `balance_minor`, `currency`, `recurring_schedule_id` |
| `bills` | AP document (supplier invoice) | `vendor_id`, `reference`, `issue_date`, `due_date`, `status`, `total_minor`, `balance_minor` |
| `expenses` | Direct spend, no formal bill | `vendor_id?`, `expense_account_id`, `date`, `amount_minor`, `tax_minor`, `receipt_file_id`, `reimbursable` |
| `payments` | Money in or out | `direction` (`in`/`out`), `method`, `client_id?`, `vendor_id?`, `bank_account_id`, `amount_minor`, `received_on`, `reference` |
| `payment_allocations` | Links a payment to invoice(s)/bill(s) | `payment_id`, `invoice_id?`, `bill_id?`, `amount_minor` |
| `accounts` | Chart of accounts | `code`, `name`, `type`, `parent_id`, `is_bank`, `currency` |
| `journal_entries` | One balanced accounting event | `entry_date`, `source_type`, `source_id`, `memo`, `reversed_by_id` |
| `journal_lines` | Debit/credit legs | `journal_entry_id`, `account_id`, `debit_minor`, `credit_minor`, `client_id?`, `project_id?` |
| `bank_accounts` / `bank_transactions` | Statement lines for reconciliation | `statement_date`, `value_date`, `amount_minor`, `memo`, `fitid`, `status`, `matched_payment_id` |
| `document_sequences` | Gap-free numbering | `doc_type`, `year`, `prefix`, `next_value` (row-locked on increment) |

---

## 4. The ledger & postings

The `journal_entries` + `journal_lines` pair is the whole accounting engine. A database
constraint (deferred trigger or check on a materialised sum) enforces
`SUM(debit_minor) = SUM(credit_minor)` per entry. Entries are never updated or deleted —
corrections post a reversing entry that references the original via `reversed_by_id`.

### Starter chart of accounts

| Code | Account | Type | Normal balance |
| ---: | --- | --- | --- |
| 1000 | Bank — Current | Asset | Debit |
| 1100 | Accounts Receivable | Asset | Debit |
| 1200 | Undeposited Funds | Asset | Debit |
| 2000 | Accounts Payable | Liability | Credit |
| 2100 | Tax Payable (Output − Input) | Liability | Credit |
| 3000 | Owner's Equity / Retained Earnings | Equity | Credit |
| 4000 | Sales Revenue | Income | Credit |
| 4900 | Other Income | Income | Credit |
| 5000 | Cost of Goods Sold | Expense | Debit |
| 6000–6999 | Operating Expenses (rent, payroll, software…) | Expense | Debit |

### Posting rules by event

| Event | Debit | Credit | Effect |
| --- | --- | --- | --- |
| **Invoice issued** (net + tax) | 1100 AR (gross) | 4000 Revenue (net) · 2100 Tax Payable (tax) | Revenue & receivable recognised |
| **Customer receipt** | 1200 Undeposited Funds *or* 1000 Bank | 1100 AR | Receivable cleared |
| **Deposit to bank** | 1000 Bank | 1200 Undeposited Funds | Cash in bank |
| **Credit note** | 4000 Revenue · 2100 Tax | 1100 AR | Reverses part/all of an invoice |
| **Bill entered** | 5000/6xxx Expense (net) · 2100 Tax (input) | 2000 AP | Payable & expense recognised |
| **Supplier payment** | 2000 AP | 1000 Bank | Payable cleared |
| **Direct expense** | 6xxx Expense · 2100 Tax | 1000 Bank / 3000 Equity (if owner-paid) | Expense recorded |
| **Bank fee / interest** | 6900 Bank Charges | 1000 Bank | Found during reconciliation |
| **Bad debt write-off** | 6800 Bad Debt Expense | 1100 AR | Uncollectible receivable removed |

### Derivations — every KPI is a ledger query

- **Revenue** = Σ credit − Σ debit on income accounts, period-filtered.
- **Expenses** = Σ debit − Σ credit on expense accounts.
- **Net Profit** = Revenue − Expenses.
- **Outstanding Due** = balance of account 1100.
- **Outstanding Payable** = balance of account 2000.
- **Cash position** = balance of all `is_bank` accounts.
- **Tax owed** = balance of account 2100.

```sql
-- Profit & Loss for a period, straight from the ledger
SELECT a.type, a.code, a.name,
       SUM(jl.credit_minor - jl.debit_minor) FILTER (WHERE a.type = 'income')  AS income_minor,
       SUM(jl.debit_minor - jl.credit_minor) FILTER (WHERE a.type = 'expense') AS expense_minor
FROM journal_lines jl
JOIN journal_entries je ON je.id = jl.journal_entry_id
JOIN accounts a ON a.id = jl.account_id
WHERE je.entry_date BETWEEN $1 AND $2
  AND a.type IN ('income', 'expense')
GROUP BY a.type, a.code, a.name
ORDER BY a.code;
```

Wrap this in a nightly materialised view (`mv_account_balances_daily`) keyed by
account + date for fast dashboards; query the live tables for drill-down.

---

## 5. Document lifecycle

The happy path from lead to cash. Each transition emits a domain event; ledger postings
and CRM timeline entries are side effects of those events, handled asynchronously.

```
Quotation ──convert──► Accepted ──InvoiceIssued──► Invoice ──PaymentReceived──► Payment ──► Paid
(draft→sent)           (signed off)   posts AR       (issued)     receipt alloc     balance=0

  part-payment loop: Invoice ◄────────► Payment  (repeat until balance = 0)
  declined / expired → close
```

Overdue is a derived state (issued + `due_date < today` + `balance > 0`), set by a daily job.

### Invoice status machine

`draft` → `issued` → `partially_paid` → `paid`; side branches `overdue`, `void`,
`credited`. Only `draft` is editable. `issued`+ is immutable; changes go through a
credit note or void-and-reissue.

### Quotation status machine

`draft` → `sent` → `accepted` / `declined` / `expired`. Editing a `sent` quote bumps
`version` and keeps the prior version for audit. `accepted` unlocks "Convert to invoice".

### Recurring invoices

A `recurring_schedules` row (template lines, interval, next_run, end condition) is
consumed by a daily job that generates a `draft` or auto-`issued` invoice. Same
mechanism serves retainers and subscriptions.

---

## 6. Bank reconciliation

With no payment gateway, the bank statement is your proof of cash. The flow turns raw
statement lines into matched, reconciled ledger activity.

1. **Import statement** — Upload CSV / OFX / MT940, or connect a read-only feed later.
   Each line stored as a `bank_transaction` with a stable `fitid` for idempotent
   re-import.
2. **Auto-match** — Rule engine scores candidates: exact amount + date window +
   reference/memo fuzzy match against open payments, invoices (by number in memo), and
   known recurring expenses. High-confidence matches are proposed, not auto-committed.
3. **Confirm or create** — User accepts a match (links
   `bank_transaction.matched_payment_id`), or creates a payment/expense inline from the
   line — bank charges, interest, direct debits found here.
4. **Post & reconcile** — Confirmed lines post the deposit-to-bank entry
   (1000 ← 1200) or expense entry. Line marked `reconciled`.
5. **Close period** — When statement closing balance = ledger bank balance for the
   date, the reconciliation is locked. A `bank_reconciliations` record stores the
   statement balance, book balance, and any adjustments.

### Edge cases to design for

Partial deposits (one bank line ← many receipts), split transactions (one line →
multiple expense categories), foreign-currency lines (store both statement and base
amounts + FX rate), timing differences (recorded but not yet cleared → "in transit"),
and duplicate imports (dedupe on `fitid`, fall back to amount+date+memo hash).

---

## 7. Reports & dashboard

### Report catalogue

| Report | Basis | Definition | Filters |
| --- | --- | --- | --- |
| **P&L (Income Statement)** | Accrual or cash | Income − COGS = Gross profit; − OpEx = Operating profit; − tax/other = Net profit | period, comparison period, by client/project/account |
| **Balance Sheet** | Point in time | Assets = Liabilities + Equity, from account balances as of date | as-of date |
| **AR Ageing** | Open receivables | Buckets: Current, 1–30, 31–60, 61–90, 90+ by `due_date` | as-of date, client, currency |
| **AP Ageing** | Open payables | Same buckets on the bill side | as-of date, vendor |
| **Cash Flow** | Cash movement | Opening cash + inflows − outflows = closing cash, by category | period, bank account |
| **Revenue Analytics** | Recognised revenue | By month, client, product, deal source; MRR/ARR if recurring | period, dimension |
| **Transactions Register** | All money events | Flat feed of journal entries + document context, searchable, CSV/Excel export | date, type, account, client, amount range |
| **Tax Report** | Tax accounts | Output tax − input tax = net payable for the filing period | tax period, jurisdiction |

### AR Ageing query shape

```sql
SELECT
  c.id, c.legal_name,
  SUM(i.balance_minor) FILTER (WHERE i.due_date >= $asof)                  AS current_minor,
  SUM(i.balance_minor) FILTER (WHERE $asof - i.due_date BETWEEN 1 AND 30)  AS d1_30_minor,
  SUM(i.balance_minor) FILTER (WHERE $asof - i.due_date BETWEEN 31 AND 60) AS d31_60_minor,
  SUM(i.balance_minor) FILTER (WHERE $asof - i.due_date BETWEEN 61 AND 90) AS d61_90_minor,
  SUM(i.balance_minor) FILTER (WHERE $asof - i.due_date > 90)              AS d90p_minor
FROM invoices i JOIN clients c ON c.id = i.client_id
WHERE i.status IN ('issued','partially_paid','overdue') AND i.balance_minor > 0
GROUP BY c.id, c.legal_name
ORDER BY d90p_minor DESC;
```

### Finance dashboard — layout

**KPI tiles (period-aware)**

- Revenue (this month vs last, % delta, sparkline)
- Expenses · Net Profit · margin %
- Cash position across bank accounts
- Outstanding Due + count of overdue invoices
- Outstanding Payable + due-this-week

**Panels**

- AR ageing bar (stacked buckets), click → ageing report
- Cash-in vs cash-out, trailing 6 months
- Top 5 clients by outstanding balance
- Recent activity feed (invoices sent, payments received, bills due)
- Quotations pipeline value by status

Dashboard reads exclusively from `mv_account_balances_daily` and a handful of
purpose-built read models — never live-aggregates the full ledger on page load.
Refresh the MV on a 5–15 min cron and on-demand after a posting.

---

## 8. API surface

REST under `/api/finance`, resource-oriented, cursor-paginated, all money as
`{ amount_minor, currency }`. State transitions are explicit sub-resources, not
`PATCH status`.

| Method & path | Purpose |
| --- | --- |
| `GET/POST /clients`, `GET/PATCH /clients/:id` | Billing profiles; `GET /clients/:id/statement` for account statement |
| `GET/POST /quotations` | List / create quotation with lines |
| `POST /quotations/:id/send` · `/accept` · `/decline` · `/convert` | Lifecycle transitions; `/convert` returns the new invoice |
| `GET/POST /invoices`, `PATCH /invoices/:id` (draft only) | List / create / edit draft |
| `POST /invoices/:id/issue` | Assigns number, sets dates, posts journal entry, emits `InvoiceIssued` |
| `POST /invoices/:id/void` · `/credit-note` · `/send` · `/reminders` | Void, raise credit note, email PDF, dunning |
| `GET /invoices/:id/pdf` | Rendered document |
| `POST /payments` | Record receipt/payment with allocations `[{invoice_id, amount_minor}]`; auto-allocates oldest-first if omitted |
| `GET/POST /bills`, `POST /bills/:id/approve` · `/pay` | Payables |
| `GET/POST /expenses` | Direct spend with receipt upload |
| `POST /bank/statements/import`, `GET /bank/transactions?status=unmatched` | Reconciliation feed |
| `POST /bank/transactions/:id/match` · `/create-payment` | Confirm match or create entry from line |
| `GET /ledger/entries`, `GET /ledger/accounts`, `POST /ledger/journal` (admin) | Ledger read; manual journal for adjustments |
| `GET /reports/pnl` · `/balance-sheet` · `/ar-ageing` · `/ap-ageing` · `/cash-flow` · `/tax` | Parametrised reports, `?format=json\|csv\|pdf` |
| `GET /dashboard/summary?period=` | All KPI tiles + panels in one payload |
| `GET /transactions` | Unified register with rich filters + export |

### Cross-cutting API rules

Idempotency-Key header on all POSTs that create money movements. Optimistic concurrency
via `If-Match` / `version` on documents. Every mutating call writes an `audit_log` row
(actor, before/after, request id). Webhooks / event stream for `invoice.issued`,
`payment.received`, `invoice.overdue` so the CRM and notifications react.

---

## 9. Services & background jobs

### Domain services

- `PostingService` — the only writer to the ledger; exposes `post(event)` with typed
  templates per event.
- `AllocationService` — distributes a payment across invoices, recomputes
  `balance_minor`, sets status.
- `NumberingService` — row-locked sequential numbers, per type/year.
- `TaxService` — line + document tax from rate rules.
- `FxService` — daily rates; base-currency conversion for reports.
- `DocumentService` — PDF render (templates), delivery + open tracking.
- `MatchingService` — bank-line scoring.

### Scheduled jobs

- **Daily 00:15** — mark invoices/bills `overdue`, emit events.
- **Daily 06:00** — generate recurring invoices due today.
- **Daily 07:00** — dunning: send reminders per schedule (−3d, due, +7d, +14d).
- **Every 15 min** — refresh `mv_account_balances_daily` + dashboard read models.
- **Hourly** — retry failed document emails; pull FX rates.
- **Monthly** — period-close checklist reminder; snapshot trial balance.

Use a durable queue (BullMQ on Redis, or `pg-boss` to avoid another dependency). Event
handlers are idempotent and retried with backoff; a dead-letter queue surfaces failures
on an ops screen.

---

## 10. CRM integration

### Data touchpoints

- **Account → Client**: an "Enable billing" action on a CRM account creates the
  `clients` row; core fields (name, address) sync one-way from CRM, billing fields are
  finance-owned.
- **Deal → Quotation**: "Create quote" from a deal pre-fills client and links
  `deal_id`; accepted quote value can push back to the deal amount.
- **Contact → AR contact**: choose which CRM contacts receive invoices and reminders.

### Timeline & UI

- Finance events post to the CRM activity timeline: quote sent, invoice issued, payment
  received, invoice overdue.
- Account page gains a **Finance** tab: outstanding balance, lifetime revenue, open
  invoices, recent payments.
- Deal page shows linked quotes and their status.
- Global **Finance** section: Dashboard, Invoices, Quotations, Bills, Expenses, Banking,
  Reports.

### Boundary rule

The CRM never writes finance tables and the finance module never writes CRM tables
directly. Integration is through the CRM's own API + the finance event stream. This
keeps the module extractable and lets the CRM stay the system of record for identity
while finance is the system of record for money.

---

## 11. Security, tax & roadmap

### Security & compliance

- **RBAC**: roles `finance_admin`, `finance_clerk` (create/edit drafts, record
  payments), `finance_viewer`, `sales` (quotes only). Manual journals and period-close
  are admin-only.
- **Audit**: append-only `audit_log`; ledger immutability; document immutability after
  issue. Retain per local statutory period (commonly 5–7 years).
- **Segregation**: the person who creates a bill should not be the one who approves
  payment — enforce with an approval step over a threshold.
- **Data protection**: encrypt bank details and tax IDs at rest (column-level or
  app-level envelope encryption); PII minimisation on exports; signed, expiring URLs
  for PDF/receipt files.
- **Backups**: point-in-time recovery on Postgres; test restores quarterly. The ledger
  must be recoverable to any second.

### Tax handling

Model `tax_rates` (name, percent, jurisdiction, effective dates) and `tax_rules`
(which rate applies given client location, product category, exemption). Compute tax
per line, then round at the document level to avoid penny drift. Store tax on its own
journal legs so the tax report is a pure account query. Support tax-exclusive and
tax-inclusive pricing modes per document.

### Delivery roadmap

1. **Phase 1 — Core ledger & AR**: Chart of accounts, journal engine, Clients,
   Products, Invoices (issue/void/credit), Payments + allocation, basic PDF. Dashboard
   with Revenue / Outstanding Due / Cash.
2. **Phase 2 — Full quote-to-cash**: Quotations + conversion, recurring invoices,
   dunning, AR ageing report, P&L, Transactions register, CRM Finance tab & timeline.
3. **Phase 3 — Payables & banking**: Bills, Expenses, AP ageing, bank statement import
   + reconciliation, Balance Sheet, Cash Flow.
4. **Phase 4 — Depth**: Multi-currency + FX revaluation, tax jurisdictions,
   project/cost-centre P&L, budget vs actual, accounting-package export (CSV mapped to
   QuickBooks/Xero/Zoho), approval workflows.
5. **Phase 5 — Optional automation**: Payment-gateway plug-in point (Stripe), bank feed
   API, customer payment portal — all designed for now, built if needed.

> **Get an accountant to sign off.** The chart of accounts, tax rules, and
> revenue-recognition timing should be reviewed against your jurisdiction and your
> business's accounting policy before Phase 1 ships. The architecture is standard
> double-entry and will accommodate whatever they specify.

---

*CRM Finance Module Blueprint · Draft v1 · 2026-09-10 · Next step: confirm the chart of
accounts and tax model, then scaffold the Ledger and Invoices modules for Phase 1.*
