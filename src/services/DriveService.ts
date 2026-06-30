import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

const CLIENT_ID = Platform.select({
  android: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  default: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
});

const REDIRECT_URI = AuthSession.makeRedirectUri();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export type DriveAuthResult = {
  accessToken: string;
  refreshToken: string | null;
};

export async function signInToDrive(): Promise<DriveAuthResult | null> {
  try {
    const authRequest = new AuthSession.AuthRequest({
      clientId: CLIENT_ID,
      scopes: [DRIVE_SCOPE],
      redirectUri: REDIRECT_URI,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    });

    const result = await authRequest.promptAsync(discovery);
    if (result.type !== 'success') return null;

    const code = result.params.code;
    const tokenResult = await exchangeCodeForToken(code);
    if (!tokenResult) return null;

    return {
      accessToken: tokenResult.access_token,
      refreshToken: tokenResult.refresh_token || null,
    };
  } catch {
    return null;
  }
}

async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token?: string;
} | null> {
  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const data = await resp.json();
    if (!data.access_token) return null;
    return { access_token: data.access_token, refresh_token: data.refresh_token };
  } catch {
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const resp = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
      }).toString(),
    });
    const data = await resp.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export async function uploadBackupToDrive(
  accessToken: string,
  jsonString: string,
  fileName: string,
): Promise<boolean> {
  const boundary = 'b3ckup_b0undary';
  const metadata = JSON.stringify({ name: fileName, parents: [] });
  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}`,
    `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${jsonString}`,
    `\r\n--${boundary}--`,
  ].join('');

  try {
    const resp = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function listBackupFiles(accessToken: string): Promise<{ id: string; name: string; createdTime: string }[]> {
  try {
    const resp = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name contains 'finance_backup_'&orderBy=createdTime desc&fields=files(id,name,createdTime)",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = await resp.json();
    return data.files || [];
  } catch {
    return [];
  }
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export function hashData(data: any): string {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function shouldAutoBackup(
  lastBackupTimestamp: number | null,
  intervalHours: number,
  dataHash: string,
  lastDataHash: string,
): boolean {
  if (!lastBackupTimestamp) return true;
  if (dataHash === lastDataHash) return false;
  const elapsedHours = (Date.now() - lastBackupTimestamp) / (1000 * 60 * 60);
  return elapsedHours >= intervalHours;
}
