'use client';

import React, { useState } from 'react';
import { MessageSquare, Mail, Send, Loader2 } from 'lucide-react';
import { dispatchReminderAction } from '@/app/actions/finance';

interface Props {
  transactionId: string;
  hasPhone: boolean;
  hasEmail: boolean;
}

export default function SendReminderButton({ transactionId, hasPhone, hasEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async (channel: 'WHATSAPP' | 'EMAIL') => {
    setLoading(true);
    try {
      const res = await dispatchReminderAction(transactionId, channel);
      if (res.success) {
        alert(`Reminder dispatched successfully via ${channel}!`);
      } else {
        alert(`Dispatch error: ${res.error}`);
      }
    } catch (error: any) {
      alert(`System error: ${error.message}`);
    }
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={loading}
        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition"
        title="Send Payment Reminder"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-6 z-50 w-44 bg-white rounded-xl shadow-xl border border-slate-100 p-1 text-xs space-y-1">
          <button
            onClick={() => handleSend('WHATSAPP')}
            disabled={!hasPhone}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            WhatsApp Alert
          </button>
          <button
            onClick={() => handleSend('EMAIL')}
            disabled={!hasEmail}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 disabled:opacity-30 transition"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            Email Statement
          </button>
        </div>
      )}
    </div>
  );
}
