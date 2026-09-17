import { AlertTriangle, Clock } from "lucide-react";
import type { Client } from "@prisma/client";

export function ExpiryRadar({ clients }: { clients: Client[] }) {
  const expiringClients = clients
    .filter(c => c.expiryDate)
    .map(c => {
      const days = Math.ceil((new Date(c.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return { ...c, daysRemaining: days };
    })
    .filter(c => c.daysRemaining <= 60)
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div className="bg-card rounded-xl border p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h2 className="text-lg font-semibold tracking-tight">Expiry Radar</h2>
      </div>

      <div className="space-y-4">
        {expiringClients.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming expiries.</p>
        ) : (
          expiringClients.map(client => {
            const isRed = client.daysRemaining <= 15;
            const isAmber = client.daysRemaining > 15 && client.daysRemaining <= 30;
            
            return (
              <div key={client.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="font-medium text-sm">{client.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {client.tradeLicenseNo ? `TL: ${client.tradeLicenseNo}` : "Visa / EID"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold
                    ${isRed ? "bg-red-100 text-red-700  " : 
                      isAmber ? "bg-amber-100 text-amber-700  " : 
                      "bg-blue-100 text-blue-700  "}
                  `}>
                    <Clock className="w-3 h-3 mr-1" />
                    {client.daysRemaining} Days
                  </span>
                  {client.phone && (
                    <a 
                      href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      className="text-xs text-green-600 hover:underline  font-medium"
                    >
                      WhatsApp Alert
                    </a>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
