import { fetchSheetData } from '@/app/actions/sheets';
import { SheetsCrmCockpit } from '@/components/sheets-crm/SheetsCrmCockpit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SheetsCrmPage() {
  const rows = await fetchSheetData();

  return (
    <div className="p-6 h-full">
      {rows.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800 shadow-sm max-w-2xl">
          <h2 className="text-lg font-bold mb-2">Google Sheets Connection Pending</h2>
          <p className="mb-4 text-sm">
            We couldn't load data from your Google Sheet. Please ensure you have added the following variables to your <code>.env</code> file:
          </p>
          <ul className="list-disc pl-5 font-mono text-xs space-y-1 bg-amber-100/50 p-3 rounded">
            <li>GOOGLE_SHEET_ID</li>
            <li>GOOGLE_SERVICE_ACCOUNT_EMAIL</li>
            <li>GOOGLE_PRIVATE_KEY</li>
          </ul>
          <p className="mt-4 text-sm">
            Also, don't forget to share your Google Sheet with your service account email!
          </p>
        </div>
      ) : (
        <SheetsCrmCockpit initialRows={rows} />
      )}
    </div>
  );
}
