import { useState } from 'react';

export function useInvoicePdf(invoiceId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPdf = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Trigger the job
      const res = await fetch(`/api/invoices/${invoiceId}/pdf`, {
        method: 'POST',
      });
      const data = await res.json();

      if (data.url) {
        window.open(data.url, '_blank');
        setLoading(false);
        return;
      }

      // 2. Poll every 2 seconds until completed
      const interval = setInterval(async () => {
        const pollRes = await fetch(`/api/invoices/${invoiceId}/pdf`);
        const pollData = await pollRes.json();

        if (pollData.completed && pollData.url) {
          clearInterval(interval);
          setLoading(false);
          window.open(pollData.url, '_blank');
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to generate PDF');
      setLoading(false);
    }
  };

  return { requestPdf, loading, error };
}
