import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MessageCircle, Edit, Trash2 } from "lucide-react";
import type { Client, Transaction } from "@prisma/client";
import { deleteClient } from "@/app/actions/clients";
import { AddClientModal } from "./AddClientModal";
import { toast } from "sonner";

export type ClientWithTransactions = Client & {
  transactions: Transaction[];
};

export function ClientsTable({ clients }: { clients: ClientWithTransactions[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<ClientWithTransactions | null>(null);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete client "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    const res = await deleteClient(id);
    setDeletingId(null);
    if (res.success) {
      toast.success("Client deleted");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete client");
    }
  };

  const getDaysRemaining = (dateStr: string | Date | null) => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const calculateFinancials = (transactions: Transaction[]) => {
    let totalBilled = 0;
    let outstanding = 0;
    
    transactions.forEach(tx => {
      if (tx.type === "INCOME") {
        totalBilled += tx.amountTotal;
        outstanding += (tx.amountTotal - tx.amountPaid);
      }
    });

    return { totalBilled: totalBilled / 100, outstanding: outstanding / 100 };
  };

  const getWhatsAppMessage = (client: ClientWithTransactions, daysRemaining: number | null, outstanding: number) => {
    let msg = "";
    
    // 1. Expiry / Renewal Reminder
    if (daysRemaining !== null && daysRemaining <= 30) {
      const docType = client.type === 'CORPORATE' ? 'Trade License' : (client.visaType || 'Visa');
      const expiryDateStr = client.type === 'CORPORATE' ? client.expiryDate : client.passportExpiry;
      const formattedDate = expiryDateStr ? new Date(expiryDateStr).toISOString().split('T')[0] : 'soon';
      
      msg = `Dear ${client.name},
Greetings from Zyra Documents Clearance Services.
This is a courtesy reminder that your ${docType} is due for renewal on ${formattedDate}. 
To avoid any portal fines or processing delays, please let us know if you would like our PRO team to initiate the clearance process.
Best regards,
Zyra Operations Team, Dubai`;
    } 
    // 2. Outstanding Balance Reminder
    else if (outstanding > 0) {
      const pendingInvoices = client.transactions
        .filter((tx: Transaction) => tx.type === "INCOME" && tx.amountTotal > tx.amountPaid)
        .sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      const latestRef = pendingInvoices.length > 0 ? pendingInvoices[0].reference : 'your invoice';
      const balanceAmount = outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 });

      msg = `Dear ${client.name},
Greetings from Zyra Documents Clearance Services.
This is an update regarding invoice reference ${latestRef}. You have an outstanding balance of AED ${balanceAmount}.
Kindly arrange the settlement at your convenience, or reply here for official payment receipts.
Best regards,
Zyra Accounts Team, Dubai`;
    } 
    // 3. General Inquiry
    else {
      msg = `Hello ${client.name},
Greetings from Zyra Documents Clearance Services. How can our PRO operations team assist your company today?`;
    }

    return encodeURIComponent(msg);
  };

  return (
    <div className="mt-6">
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {clients.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3 bg-card border border-border rounded-xl">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-muted-foreground text-sm">No clients found matching the filters.</p>
          </div>
        )}
        {clients.map((client) => {
          const daysRemaining = getDaysRemaining(client.type === 'CORPORATE' ? client.expiryDate : client.passportExpiry);
          const { totalBilled, outstanding } = calculateFinancials(client.transactions);
          const formattedPhone = client.phone?.replace(/[^0-9]/g, '');

          return (
            <div
              key={client.id}
              onClick={() => setEditingClient(client)}
              className="bg-card border border-border rounded-xl shadow-sm p-4 cursor-pointer hover:border-primary/50 active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/clients/${client.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="font-semibold text-foreground truncate hover:text-primary hover:underline block"
                  >
                    {client.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[11px] font-semibold text-slate-500">{client.id.substring(0, 11).toUpperCase()}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded-full border ${
                      client.type === 'CORPORATE' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {client.type}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {outstanding > 0 ? (
                    <div className="text-rose-600 font-bold text-sm">AED {outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  ) : (
                    <span className="text-emerald-600 text-[11px] font-bold uppercase tracking-wider">Clear</span>
                  )}
                  <div className="text-[11px] text-muted-foreground mt-0.5">Billed AED {totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>{client.phone || "No phone"} &middot; {client.place || "N/A"}</span>
              </div>

              {daysRemaining !== null && (
                <div className="mt-2">
                  {daysRemaining < 15 ? (
                    <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-rose-50 border-rose-200 text-rose-800">Critical: {daysRemaining} days</span>
                  ) : daysRemaining <= 30 ? (
                    <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-amber-50 border-amber-200 text-amber-800">Due Soon: {daysRemaining} days</span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-emerald-50 border-emerald-200 text-emerald-800">Active: {daysRemaining} days</span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border" onClick={(e) => e.stopPropagation()}>
                {formattedPhone ? (
                  <a
                    href={`https://wa.me/${formattedPhone}?text=${getWhatsAppMessage(client, daysRemaining, outstanding)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-11 h-11 rounded-full text-emerald-600 active:scale-95 active:bg-emerald-50 transition-transform"
                    title="Message on WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                ) : (
                  <span className="flex items-center justify-center w-11 h-11 rounded-full text-slate-300" title="No phone number">
                    <MessageCircle className="w-5 h-5" />
                  </span>
                )}
                <button
                  onClick={() => setEditingClient(client)}
                  className="flex items-center justify-center w-11 h-11 rounded-full text-primary active:scale-95 active:bg-primary/10 transition-transform"
                  title="Edit Profile"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  disabled={deletingId === client.id}
                  className="flex items-center justify-center w-11 h-11 rounded-full text-rose-500 active:scale-95 active:bg-rose-50 transition-transform disabled:opacity-50"
                  title="Delete Client"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto whitespace-nowrap scrollbar-hide">
        <table className="w-full text-sm text-left">
          <thead className="text-[11px] font-bold tracking-wider uppercase bg-slate-50 text-slate-600 border-b border-border">
            <tr>
              <th className="px-4 py-3 sticky left-0 z-10 bg-slate-50 backdrop-blur-md">CLIENT NAME</th>
              <th className="px-4 py-3">CLIENT ID / REF</th>
              <th className="px-4 py-3">CONTACT & PLACE</th>
              <th className="px-4 py-3">VISA / LICENSE TYPE</th>
              <th className="px-4 py-3">EXPIRY DATE & STATUS</th>
              <th className="px-4 py-3 text-right">TOTAL BILLED (AED)</th>
              <th className="px-4 py-3 text-right">OUTSTANDING (AED)</th>
              <th className="px-4 py-3 text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.map((client) => {
              const daysRemaining = getDaysRemaining(client.type === 'CORPORATE' ? client.expiryDate : client.passportExpiry);
              const { totalBilled, outstanding } = calculateFinancials(client.transactions);
              const formattedPhone = client.phone?.replace(/[^0-9]/g, '');

              return (
                <tr
                  key={client.id}
                  onClick={() => setEditingClient(client)}
                  className="hover:bg-slate-50 transition-colors group bg-card text-sm font-medium text-slate-800 cursor-pointer"
                >
                  <td className="px-4 py-3 align-top font-semibold text-foreground sticky left-0 z-10 bg-card group-hover:bg-slate-50 border-r border-border shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                    <Link
                      href={`/clients/${client.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="hover:text-primary hover:underline"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-xs font-semibold text-slate-600">{client.id.substring(0, 11).toUpperCase()}</div>
                    <span className={`inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border ${
                      client.type === 'CORPORATE' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                    }`}>
                      {client.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-foreground font-medium">{client.phone || "No Phone"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{client.place || "N/A"}</div>
                  </td>
                  <td className="px-4 py-3 align-top text-muted-foreground">
                    {client.type === 'CORPORATE' ? 'Trade License' : (client.visaType || 'N/A')}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {daysRemaining !== null ? (
                      <div>
                        <div className="text-foreground font-medium">
                          {new Date(client.type === 'CORPORATE' ? client.expiryDate! : client.passportExpiry!).toISOString().split('T')[0]}
                        </div>
                        {daysRemaining < 15 ? (
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-rose-50 border-rose-200 text-rose-800">Critical: {daysRemaining} days</span>
                        ) : daysRemaining <= 30 ? (
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-amber-50 border-amber-200 text-amber-800">Due Soon: {daysRemaining} days</span>
                        ) : (
                          <span className="inline-block mt-1 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide rounded-full border bg-emerald-50 border-emerald-200 text-emerald-800">Active: {daysRemaining} days</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No Expiry Data</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-right font-medium text-foreground">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-xs text-slate-500 mr-1 font-medium">AED</span>
                      <span className="font-bold">{totalBilled.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top text-right font-bold">
                    {outstanding > 0 ? (
                      <div className="flex items-baseline justify-end gap-1 text-rose-600">
                        <span className="text-xs opacity-80 mr-1 font-medium">AED</span>
                        <span>{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ) : (
                      <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">Clear</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-3">
                      {formattedPhone ? (
                        <a href={`https://wa.me/${formattedPhone}?text=${getWhatsAppMessage(client, daysRemaining, outstanding)}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-500 transition-colors" title="Message on WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-slate-300 cursor-not-allowed" title="No phone number"><MessageCircle className="w-4 h-4" /></span>
                      )}
                      <button onClick={() => setEditingClient(client)} className="text-primary hover:text-primary/70 transition-colors" title="Edit Profile">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(client.id, client.name)}
                        disabled={deletingId === client.id}
                        className="text-rose-500 hover:text-rose-400 transition-colors disabled:opacity-50"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {clients.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-muted-foreground text-sm">No clients found matching the filters.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {editingClient && (
        <AddClientModal
          open={!!editingClient}
          onOpenChange={(o) => { if (!o) setEditingClient(null); }}
          client={editingClient}
        />
      )}
    </div>
  );
}
