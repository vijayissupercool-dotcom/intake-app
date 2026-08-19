import { google } from "googleapis";
import { env } from "@/lib/config/env";

export interface DriveTokens {
  access_token: string;
  refresh_token: string;
  expiry_date?: number;
  token_type?: string;
  scope?: string;
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.google.drive.clientId,
    env.google.drive.clientSecret,
    `${env.app.url}/api/auth/callback`
  );
}

export function getDriveClient(tokens: DriveTokens) {
  const auth = getOAuth2Client();
  auth.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  });
  return google.drive({ version: "v3", auth });
}

export function getAuthUrl(state: string) {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      // Full Drive access: lets the app list the user's folders AND
      // create/deliver uploaded files into the folder they choose.
      "https://www.googleapis.com/auth/drive",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    state,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

export async function refreshAccessToken(refreshToken: string) {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

export async function uploadFileToDrive(
  drive: ReturnType<typeof getDriveClient>,
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId?: string
) {
  const { Readable } = await import("stream");

  const fileMetadata: Record<string, unknown> = {
    name: fileName,
  };
  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const media = {
    mimeType,
    body: new Readable({
      read() {
        this.push(fileBuffer);
        this.push(null);
      },
    }),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: "id, name, mimeType, size, createdTime",
  });

  return response.data;
}
