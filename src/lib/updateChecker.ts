/**
 * Auto-update checker for Imagine
 * Queries GitHub Releases API for latest version, compares with current installed version,
 * and provides direct download URLs for APK and EXE binaries.
 */

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle: string;
  releaseNotes: string;
  publishedAt: string;
  apkDownloadUrl?: string;
  exeDownloadUrl?: string;
  releaseUrl: string;
}

declare const __APP_VERSION__: string | undefined;

export const CURRENT_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.1.0';
const GITHUB_REPO = 'whatrushki/imagine';

/** Parse semver-like string "1.0.2" or "v1.0.2" into comparable numbers */
function parseVersion(v: string): number[] {
  return v
    .replace(/^v/i, '')
    .trim()
    .split('.')
    .map((num) => parseInt(num, 10) || 0);
}

/** Returns true if versionB is newer than versionA */
export function isNewerVersion(current: string, latest: string): boolean {
  const [cMajor, cMinor, cPatch = 0] = parseVersion(current);
  const [lMajor, lMinor, lPatch = 0] = parseVersion(latest);

  if (lMajor > cMajor) return true;
  if (lMajor < cMajor) return false;

  if (lMinor > cMinor) return true;
  if (lMinor < cMinor) return false;

  return lPatch > cPatch;
}

/** Check GitHub Releases for updates */
export async function checkForAppUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const latestVersion = (data.tag_name || '').replace(/^v/i, '');

    if (!latestVersion) return null;

    const hasUpdate = isNewerVersion(CURRENT_VERSION, latestVersion);

    let apkDownloadUrl: string | undefined;
    let exeDownloadUrl: string | undefined;

    if (Array.isArray(data.assets)) {
      for (const asset of data.assets) {
        const name = (asset.name || '').toLowerCase();
        if (name.endsWith('.apk')) {
          apkDownloadUrl = asset.browser_download_url;
        } else if (name.endsWith('.exe')) {
          exeDownloadUrl = asset.browser_download_url;
        }
      }
    }

    return {
      hasUpdate,
      currentVersion: CURRENT_VERSION,
      latestVersion,
      releaseTitle: data.name || `Imagine v${latestVersion}`,
      releaseNotes: data.body || '',
      publishedAt: data.published_at || '',
      apkDownloadUrl,
      exeDownloadUrl,
      releaseUrl: data.html_url || `https://github.com/${GITHUB_REPO}/releases/latest`,
    };
  } catch (err) {
    console.warn('Update check failed:', err);
    return null;
  }
}
