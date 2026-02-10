import { uploadImage } from '../lib/cloudinary';
import { uploadToR2, isR2Configured } from '../lib/r2';

interface ScreenshotUrls {
  screenshotUrl?: string;
  screenshotBackupUrl?: string;
}

/**
 * Convert data-URL screenshots to Cloudinary CDN URLs with optional R2 backup.
 * - If the URL starts with `data:image/`, extract the base64 payload,
 *   upload to Cloudinary (primary) and R2 (backup), return both URLs.
 * - If the URL is already HTTPS or undefined, pass through as-is.
 */
export async function processScreenshotUrl(
  url: string | undefined
): Promise<ScreenshotUrls> {
  if (!url || !url.startsWith('data:image/')) {
    return { screenshotUrl: url };
  }

  const commaIndex = url.indexOf(',');
  if (commaIndex === -1) {
    return { screenshotUrl: url };
  }

  const base64Data = url.slice(commaIndex + 1);
  const buffer = Buffer.from(base64Data, 'base64');

  // Primary: Cloudinary CDN
  const { url: cdnUrl } = await uploadImage(buffer, 'bugsnap/screenshots');

  // Backup: Cloudflare R2 (optional, non-blocking)
  let backupUrl: string | undefined;
  if (isR2Configured()) {
    try {
      backupUrl = await uploadToR2(buffer);
    } catch (error) {
      console.warn('R2 backup upload failed, continuing with Cloudinary only:', error);
    }
  }

  return { screenshotUrl: cdnUrl, screenshotBackupUrl: backupUrl };
}
