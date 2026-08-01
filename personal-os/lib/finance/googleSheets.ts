import { JWT } from "google-auth-library";
import ExcelJS from "exceljs";

async function getAuthClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!email || !key) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_KEY");
  }

  const client = new JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive.readonly"],
  });
  await client.authorize();
  return client;
}

/** Downloads the finance workbook (exported as XLSX via Drive API) and returns all tabs as 2D arrays. */
export async function fetchFinanceWorkbook(): Promise<Record<string, unknown[][]>> {
  const sheetId = process.env.GOOGLE_SHEETS_FINANCE_ID;
  if (!sheetId) throw new Error("Missing GOOGLE_SHEETS_FINANCE_ID");

  const client = await getAuthClient();
  const accessToken = (await client.getAccessToken()).token;

  const exportUrl = `https://www.googleapis.com/drive/v3/files/${sheetId}/export?mimeType=application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`;
  const res = await fetch(exportUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive export failed: ${res.status} ${await res.text()}`);

  const buffer = await res.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const tabs: Record<string, unknown[][]> = {};
  workbook.eachSheet((sheet) => {
    const rows: unknown[][] = [];
    sheet.eachRow((row) => {
      rows.push((row.values as unknown[]).slice(1)); // exceljs pads index 0
    });
    tabs[sheet.name] = rows;
  });

  return tabs;
}
