import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

const WEB_CLIENT_ID = '542220749719-llq63d63hn9vt8miij87uce075kpnhv2.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '542220749719-ghdh3fgjol1un209i2mc22gqp4qcdtqf.apps.googleusercontent.com';

GoogleSignin.configure({
  webClientId: WEB_CLIENT_ID,
  androidClientId: ANDROID_CLIENT_ID,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
  offlineAccess: true,
});

export type DriveAuthResult = {
  accessToken: string;
  refreshToken: string | null;
};

export async function signInToDrive(): Promise<DriveAuthResult | null> {
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const userInfo = await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    return {
      accessToken: tokens.accessToken,
      refreshToken: null,
    };
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
    return null;
  }
}

export async function signOutFromDrive(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {}
}

export async function refreshAccessToken(): Promise<string | null> {
  try {
    const tokens = await GoogleSignin.getTokens();
    return tokens.accessToken;
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
