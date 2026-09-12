'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase browser client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  invoiceId: string;
  initialUrl?: string | null;
}

export function InvoicePdfDownload({ invoiceId, initialUrl }: Props) {
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If URL already exists, no need to listen
    if (url) return;

    // Listen to changes on the specific invoice row
    const channel = supabase
      .channel(`invoice-realtime-${invoiceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Invoice',
          filter: `id=eq.${invoiceId}`,
        },
        (payload) => {
          const updated = payload.new as { govReceiptUrl?: string | null };
          if (updated.govReceiptUrl) {
            setUrl(updated.govReceiptUrl);
            setLoading(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [invoiceId, url]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.url) {
        setUrl(data.url);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to trigger generation', err);
      setLoading(false);
    }
  };

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm inline-flex items-center gap-2"
      >
        <span>Download Invoice PDF</span>
      </a>
    );
  }

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-sm inline-flex items-center gap-2"
    >
      {loading ? (
        <>
          <span className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          <span>Generating in background...</span>
        </>
      ) : (
        <span>Generate PDF</span>
      )}
    </button>
  );
}
