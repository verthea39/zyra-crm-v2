# SYSTEM PROMPT: EXECUTIVE CASH FLOW COCKPIT & CLIENT MANAGEMENT ECOSYSTEM

## 1. System Overview & Objective
Build an interactive, bi-directional single-page executive web application in React (Google Sheets Canvas integration) tailored for UAE corporate and immigration consulting operations.
The app serves as a real-time command center linking two primary core entities:
1. Executive Cash Flow & Financial Ledger (Inflow / Outflow, Receivables AR, Payables AP, Net Margin).
2. Client Profiles Directory & Document Compliance Registry (Passports, Emirates IDs, Visas, Contact Records).

All data mutations must strictly sync directly with the underlying Google Sheet backend using non-sparse array mapping without generating phantom rows or reappearing deleted items.

---

## 2. Core Architecture & State Management

### A. Data Lineage & Backend Synchronization
- **Backing Range**: `Transactions!A1:I`
- **Dynamic Header Mapping**: 
  - Scan the initial rows to locate header positions dynamically (`Transaction ID`, `Type`, `Category`, `Counterparty`, `Date`, `Amount (AED)`, `Payment Status`, `Due Date`, `Description`).
  - Fall back to schema default indexes:
    - Index 0: `id` (e.g., `INV-2026-001`, `EXP-2026-001`, `CLI-2026-001`)
    - Index 1: `type` (`Income`, `Expense`, `Client`)
    - Index 2: `category` (Visa Services, Rent, Salaries, PRO Fees, etc.)
    - Index 3: `counterparty` (Client Full Name or Vendor Name)
    - Index 4: `date` (Transaction issue date, ISO `YYYY-MM-DD`)
    - Index 5: `amount` (Total monetary value in AED)
    - Index 6: `status` (`Paid`, `Pending`, `Overdue`, `Active`)
    - Index 7: `dueDate` (Settlement due date or Document expiry)
    - Index 8: `description` (Structured metadata delimiter: `Key: Value | Key: Value`)

### B. Pure Ground-Truth Rule (Anti-Duplication / Deletion Integrity)
- **Zero Artificial Re-seeding**: Never re-inject deleted rows via in-memory mock constants or mounting `useEffect` loops.
- When an item is deleted via `deleteItem(item.index_)`, the state must reflect spreadsheet ground truth immediately.
- Clean parsing of dates: Handle standard ISO (`YYYY-MM-DD`), regional strings (`DD-MM-YYYY`), and Excel numeric serial numbers (e.g., `45678`).

---

## 3. Financial Engine & Telemetry Logic

### Executive KPI Formulas
1. **Billed Revenue (Gross Inflow)**:
   $$\text{Revenue} = \sum \text{Amount for all rows where } \text{Type} = \text{'Income'}$$
2. **Total Expenses (Operational Outflow)**:
   $$\text{Expenses} = \sum \text{Amount for all rows where } \text{Type} = \text{'Expense'}$$
3. **Net Profit**:
   $$\text{Net Profit} = \text{Billed Revenue} - \text{Total Expenses}$$
   - Dynamic UI: Emerald green if positive, deep rose red if negative.
4. **Accounts Receivable (AR)**:
   $$\text{AR} = \sum \text{Uncollected Balance for Income rows with status } \in \{\text{'Pending'}, \text{'Overdue'}\}$$
5. **Accounts Payable (AP)**:
   $$\text{AP} = \sum \text{Unsettled Balance for Expense rows with status } \in \{\text{'Pending'}, \text{'Overdue'}\}$$

### Embedded Payment Token Parsing
- Transaction `Description` carries structured micro-state tokens:
  - `Paid: AED X`
  - `Balance: AED Y`
  - `Phone: +971...`
  - `Mode: Card | Cash | Bank Transfer | Cheque`
- Automated status synchronization:
  - If `Paid >= Amount`: Auto-set Status to `Paid`.
  - If `Paid < Amount` and status was `Paid`: Auto-reset to `Pending`.

---

## 4. Dual Workspace Views

### Tab 1: Executive Transactions Ledger
- **Telemetry Bar**: 5 metric cards featuring status-color accents and trend icons.
- **Filtering Suite**:
  - Live full-text search across Counterparties, IDs, Categories, and Descriptions.
  - Quick-toggle pills for Type (`All`, `Income`, `Expense`).
  - Quick-toggle pills for Status (`All`, `Paid`, `Pending`, `Overdue`).
- **Interactive Ledger Table**:
  - Direct 1-click status cycling (`Paid` ↔ `Pending` ↔ `Overdue`).
  - Currency display: standard UAE format (`AED 1,250.00`).
  - Conditional row tinting (Amber for pending invoices, Rose for overdue liabilities).
  - Inline action cluster: Quick Edit modal and two-step safety Delete confirmation.
  - "Clear All Records" safety routine (reverse-index deletion).

### Tab 2: Client Profiles & Compliance Directory
- **Entity Differentiation**: Separates `Client` profile metadata from financial ledger rows.
- **Fields Captured**:
  - Client ID (`CLI-2026-XXX`)
  - Full Name (EN) & Client Type (`Individual Client` vs. `Corporate`)
  - Lead Source (`Walk-in`, `Referral`, `WhatsApp`, `Portal`, `Field Agent`)
  - Place / Emirate (`Dubai`, `Abu Dhabi`, `Sharjah`, `Ajman`, etc.)
  - Contact Number (with click-to-call / copy)
  - Nationality
  - Visa Type (`Employment`, `Investor/Partner`, `Golden Visa 10-Yr`, `Freelance`, `Family`)
  - Passport Number & Expiry Date (`DD-MM-YYYY`)
  - Emirates ID Number & Expiry Date (`784-XXXX-XXXXXXX-X`)
- **Direct Linkage Action (+ Bill Client)**:
  - Clicking "+ Bill" on any client profile auto-populates the Income invoice modal with the client's name, phone, and visa category.
- **Client Dossier Modal**:
  - Displays full identification credentials and an aggregated financial ledger of all invoices, amounts paid, and outstanding balances specific to that client.

---

## 5. UI/UX & Component Styling Specifications
- **Design System**: Modern Slate & Titanium corporate palette built with Tailwind CSS.
- **Icons**: `lucide-react` (`Plus`, `Trash2`, `Edit3`, `Search`, `Filter`, `Users`, `Layers`, `ShieldCheck`, `Eye`, etc.).
- **Typography**: Tabular numeric figures (`font-mono`) for currency, transaction IDs, phone numbers, and passport/EID codes.
- **Modals**: Fixed backdrop blur (`backdrop-blur-sm`), keyboard escape dismissal, and scrollable containers (`max-h-[85vh]`).

---

## 6. Integrations & Next Steps (New Section)
- **Google Sheets API setup**: Service account integration for automated raw updates.
- **Phase 2 Pipeline**: Integration with WhatsApp API for automated invoice dispatch and compliance reminders.
