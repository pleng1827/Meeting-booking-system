import { google } from 'googleapis';
import { Readable } from 'stream';
import { getGoogleAuthClient, isGoogleAuthConfigured } from './auth';
import { GoogleDriveUploadResult } from '@/types/google';

/**
 * Checks if Google Drive integration is configured.
 */
export function isGoogleDriveEnabled(): boolean {
  return isGoogleAuthConfigured() && Boolean(process.env.GOOGLE_DRIVE_FOLDER_ID);
}

interface UploadParams {
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  folderId?: string;
}

/**
 * Converts a Node.js Buffer to a Readable stream for Google Drive upload.
 */
function bufferToStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

/**
 * Uploads a meeting attachment file to Google Drive and makes it viewable.
 */
export async function uploadFileToDrive({
  fileBuffer,
  fileName,
  mimeType,
  folderId,
}: UploadParams): Promise<GoogleDriveUploadResult> {
  const targetFolderId = folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!isGoogleDriveEnabled()) {
    console.log('[GoogleDrive:Mock] GCP Credentials not configured. Generating mock Drive link for:', fileName);
    const mockId = `mock_drive_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return {
      fileId: mockId,
      name: fileName,
      webViewLink: `https://drive.google.com/file/d/${mockId}/view?usp=sharing`,
      webContentLink: `https://drive.google.com/uc?id=${mockId}&export=download`,
      size: fileBuffer.length,
    };
  }

  try {
    const auth = getGoogleAuthClient();
    if (!auth) throw new Error('Failed to obtain Google Auth client');

    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata: any = {
      name: fileName,
    };

    if (targetFolderId) {
      fileMetadata.parents = [targetFolderId];
    }

    const media = {
      mimeType,
      body: bufferToStream(fileBuffer),
    };

    // 1. Create file in Google Drive
    const file = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id, name, webViewLink, webContentLink, size',
    });

    const fileId = file.data.id;
    if (!fileId) throw new Error('Google Drive did not return a valid file ID');

    // 2. Grant read permissions so team members can view the document
    try {
      await drive.permissions.create({
        fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn('[GoogleDrive] Note: Could not set public link permission (might be restricted by Google Workspace domain policy):', permError);
    }

    // 3. Re-fetch webViewLink to ensure public link is returned
    const updated = await drive.files.get({
      fileId,
      fields: 'id, name, webViewLink, webContentLink, size',
    });

    return {
      fileId,
      name: updated.data.name || fileName,
      webViewLink: updated.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
      webContentLink: updated.data.webContentLink || `https://drive.google.com/uc?id=${fileId}&export=download`,
      size: Number(updated.data.size || fileBuffer.length),
    };
  } catch (error: any) {
    console.error('[GoogleDrive] File upload failed:', error);
    throw new Error(`Google Drive Upload Error: ${error.message || 'Unknown error'}`);
  }
}
