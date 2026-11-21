import { sheets as sheetsApi, sheets_v4 } from '@googleapis/sheets';
import { drive as driveApi, drive_v3 } from '@googleapis/drive';
import { GoogleAuth, OAuth2Client } from 'google-auth-library';
import { ENV } from './env.js';

export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

export type GoogleAuthMode = 'oauth' | 'service-account';

function createAuth(): { auth: GoogleAuth | OAuth2Client; mode: GoogleAuthMode } {
  if (ENV.GOOGLE_OAUTH_CLIENT_ID && ENV.GOOGLE_OAUTH_CLIENT_SECRET && ENV.GOOGLE_OAUTH_REFRESH_TOKEN) {
    const client = new OAuth2Client(ENV.GOOGLE_OAUTH_CLIENT_ID, ENV.GOOGLE_OAUTH_CLIENT_SECRET);
    client.setCredentials({ refresh_token: ENV.GOOGLE_OAUTH_REFRESH_TOKEN });
    return { auth: client, mode: 'oauth' };
  }
  if (ENV.GOOGLE_SERVICE_ACCOUNT_KEY_FILE)
    return { auth: new GoogleAuth({ keyFile: ENV.GOOGLE_SERVICE_ACCOUNT_KEY_FILE, scopes: GOOGLE_SCOPES }), mode: 'service-account' };
  if (ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL && ENV.GOOGLE_PRIVATE_KEY)
    return {
      auth: new GoogleAuth({ credentials: { client_email: ENV.GOOGLE_SERVICE_ACCOUNT_EMAIL, private_key: ENV.GOOGLE_PRIVATE_KEY }, scopes: GOOGLE_SCOPES }),
      mode: 'service-account'
    };
  throw new Error('Kredensial Google belum diatur. Isi GOOGLE_OAUTH_* atau GOOGLE_SERVICE_ACCOUNT_* di file .env.');
}

let cached: { sheets: sheets_v4.Sheets; drive: drive_v3.Drive; mode: GoogleAuthMode } | null = null;

export function google() {
  if (!cached) {
    const { auth, mode } = createAuth();
    cached = { sheets: sheetsApi({ version: 'v4', auth: auth as any }), drive: driveApi({ version: 'v3', auth: auth as any }), mode };
  }
  return cached;
}

export function spreadsheetId(): string {
  if (!ENV.GOOGLE_SPREADSHEET_ID) throw new Error('GOOGLE_SPREADSHEET_ID belum diatur di file .env.');
  return ENV.GOOGLE_SPREADSHEET_ID;
}
