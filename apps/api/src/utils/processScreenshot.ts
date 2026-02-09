import { uploadImage } from '../lib/cloudinary';

/**
 * Convert data-URL screenshots to Cloudinary CDN URLs.
 * - If the URL starts with `data:image/`, extract the base64 payload,
 *   upload to Cloudinary, and return the CDN URL.
 * - If the URL is already HTTPS or undefined, pass through as-is.
 */
export async function processScreenshotUrl(
  url: string | undefined
): Promise<string | undefined> {
  if (!url || !url.startsWith('data:image/')) {
    return url;
  }

  const commaIndex = url.indexOf(',');
  if (commaIndex === -1) {
    return url;
  }

  const base64Data = url.slice(commaIndex + 1);
  const buffer = Buffer.from(base64Data, 'base64');
  const { url: cdnUrl } = await uploadImage(buffer, 'bugsnap/screenshots');
  return cdnUrl;
}
