import { google } from 'googleapis';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

/**
 * Checks if Google Service Account credentials are fully configured.
 */
export function isGoogleAuthConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  return Boolean(
    email &&
    privateKey &&
    email.includes('@') &&
    privateKey.includes('PRIVATE KEY')
  );
}

/**
 * Returns an authenticated GoogleAuth client or null if not configured.
 */
export function getGoogleAuthClient() {
  if (!isGoogleAuthConfigured()) {
    return null;
  }

  try {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Format escaped newlines in environment variable
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    return new google.auth.GoogleAuth({
      credentials: {
        client_email: email,
        private_key: privateKey,
        project_id: process.env.GOOGLE_PROJECT_ID,
      },
      scopes: SCOPES,
    });
  } catch (error) {
    console.error('[GoogleAuth] Failed to initialize GoogleAuth client:', error);
    return null;
  }
}
