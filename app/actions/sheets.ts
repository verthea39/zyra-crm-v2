'use server';

import { GoogleSpreadsheet, GoogleSpreadsheetRow } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { revalidatePath } from 'next/cache';

const getDoc = async () => {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY || !process.env.GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets credentials missing in .env');
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
  await doc.loadInfo();
  return doc;
};

export interface TransactionRow {
  rowIndex: number;
  id: string;
  type: string;
  category: string;
  counterparty: string;
  date: string;
  amount: number;
  status: string;
  dueDate: string;
  description: string;
}

export async function fetchSheetData(): Promise<TransactionRow[]> {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Transactions'] || doc.sheetsByIndex[0];
    
    // Automatically loads the header row at index 1
    const rows = await sheet.getRows();

    return rows.map((row) => ({
      rowIndex: row.rowNumber,
      id: row.get('Transaction ID') || '',
      type: row.get('Type') || '',
      category: row.get('Category') || '',
      counterparty: row.get('Counterparty') || '',
      date: row.get('Date') || '',
      amount: parseFloat(row.get('Amount (AED)')?.replace(/,/g, '') || '0'),
      status: row.get('Payment Status') || '',
      dueDate: row.get('Due Date') || '',
      description: row.get('Description') || '',
    }));
  } catch (error) {
    console.error('Failed to fetch Google Sheets data:', error);
    return [];
  }
}

export async function updateTransactionStatus(rowIndex: number, newStatus: string) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Transactions'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.rowNumber === rowIndex);
    if (row) {
      row.set('Payment Status', newStatus);
      await row.save();
      revalidatePath('/sheets-crm');
      return { success: true };
    }
    return { success: false, error: 'Row not found' };
  } catch (error) {
    console.error('Failed to update transaction:', error);
    return { success: false, error: String(error) };
  }
}

export async function deleteTransaction(rowIndex: number) {
  try {
    const doc = await getDoc();
    const sheet = doc.sheetsByTitle['Transactions'] || doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const row = rows.find(r => r.rowNumber === rowIndex);
    if (row) {
      await row.delete();
      revalidatePath('/sheets-crm');
      return { success: true };
    }
    return { success: false, error: 'Row not found' };
  } catch (error) {
    console.error('Failed to delete transaction:', error);
    return { success: false, error: String(error) };
  }
}
