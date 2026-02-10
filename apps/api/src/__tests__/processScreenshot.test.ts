import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock cloudinary
vi.mock('../lib/cloudinary', () => ({
  uploadImage: vi.fn().mockResolvedValue({
    url: 'https://res.cloudinary.com/test/image/upload/screenshot.png',
    publicId: 'bugsnap/screenshots/abc123',
  }),
}));

// Mock r2
vi.mock('../lib/r2', () => ({
  isR2Configured: vi.fn().mockReturnValue(false),
  uploadToR2: vi.fn().mockResolvedValue('https://r2.example.com/screenshots/backup.png'),
}));

import { processScreenshotUrl } from '../utils/processScreenshot';
import { uploadImage } from '../lib/cloudinary';
import { isR2Configured, uploadToR2 } from '../lib/r2';

const mockedIsR2Configured = vi.mocked(isR2Configured);
const mockedUploadToR2 = vi.mocked(uploadToR2);
const mockedUploadImage = vi.mocked(uploadImage);

describe('processScreenshotUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedIsR2Configured.mockReturnValue(false);
  });

  it('returns { screenshotUrl: undefined } for undefined input', async () => {
    const result = await processScreenshotUrl(undefined);
    expect(result).toEqual({ screenshotUrl: undefined });
    expect(mockedUploadImage).not.toHaveBeenCalled();
  });

  it('passes through non-data URLs as screenshotUrl only', async () => {
    const result = await processScreenshotUrl('https://example.com/img.png');
    expect(result).toEqual({ screenshotUrl: 'https://example.com/img.png' });
    expect(mockedUploadImage).not.toHaveBeenCalled();
  });

  it('passes through data URL without comma as screenshotUrl', async () => {
    const result = await processScreenshotUrl('data:image/pngBASE64DATAONLY');
    expect(result).toEqual({ screenshotUrl: 'data:image/pngBASE64DATAONLY' });
    expect(mockedUploadImage).not.toHaveBeenCalled();
  });

  it('uploads data URL to Cloudinary and returns screenshotUrl', async () => {
    const dataUrl = 'data:image/png;base64,aGVsbG8=';
    const result = await processScreenshotUrl(dataUrl);

    expect(result.screenshotUrl).toBe('https://res.cloudinary.com/test/image/upload/screenshot.png');
    expect(result.screenshotBackupUrl).toBeUndefined();
    expect(mockedUploadImage).toHaveBeenCalledWith(
      expect.any(Buffer),
      'bugsnap/screenshots',
    );
  });

  it('returns both URLs when R2 is configured', async () => {
    mockedIsR2Configured.mockReturnValue(true);
    const dataUrl = 'data:image/png;base64,aGVsbG8=';
    const result = await processScreenshotUrl(dataUrl);

    expect(result.screenshotUrl).toBe('https://res.cloudinary.com/test/image/upload/screenshot.png');
    expect(result.screenshotBackupUrl).toBe('https://r2.example.com/screenshots/backup.png');
    expect(mockedUploadToR2).toHaveBeenCalledWith(expect.any(Buffer));
  });

  it('returns screenshotUrl without backup when R2 upload fails', async () => {
    mockedIsR2Configured.mockReturnValue(true);
    mockedUploadToR2.mockRejectedValueOnce(new Error('R2 network error'));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const dataUrl = 'data:image/png;base64,aGVsbG8=';
    const result = await processScreenshotUrl(dataUrl);

    expect(result.screenshotUrl).toBe('https://res.cloudinary.com/test/image/upload/screenshot.png');
    expect(result.screenshotBackupUrl).toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith(
      'R2 backup upload failed, continuing with Cloudinary only:',
      expect.any(Error),
    );
  });

  it('skips R2 when not configured', async () => {
    mockedIsR2Configured.mockReturnValue(false);
    const dataUrl = 'data:image/png;base64,aGVsbG8=';
    await processScreenshotUrl(dataUrl);

    expect(mockedUploadToR2).not.toHaveBeenCalled();
  });
});
