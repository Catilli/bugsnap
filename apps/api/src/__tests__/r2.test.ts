import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @aws-sdk/client-s3 before importing r2
const mockSend = vi.fn().mockResolvedValue({});
vi.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    constructor(public config: any) {}
    send = mockSend;
  }
  class MockPutObjectCommand {
    constructor(public input: any) {}
  }
  return { S3Client: MockS3Client, PutObjectCommand: MockPutObjectCommand };
});

describe('R2 service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('isR2Configured() returns false when env vars are missing', async () => {
    delete process.env.R2_ACCOUNT_ID;
    delete process.env.R2_ACCESS_KEY_ID;
    delete process.env.R2_SECRET_ACCESS_KEY;
    delete process.env.R2_BUCKET_NAME;
    delete process.env.R2_PUBLIC_URL;

    const { isR2Configured } = await import('../lib/r2');
    expect(isR2Configured()).toBe(false);
  });

  it('isR2Configured() returns true when all env vars are set', async () => {
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.R2_ACCESS_KEY_ID = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://r2.example.com';

    const { isR2Configured } = await import('../lib/r2');
    expect(isR2Configured()).toBe(true);
  });

  it('uploadToR2() calls S3Client.send with correct params', async () => {
    process.env.R2_ACCOUNT_ID = 'test-account';
    process.env.R2_ACCESS_KEY_ID = 'test-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://r2.example.com';

    const { uploadToR2 } = await import('../lib/r2');

    const buffer = Buffer.from('fake-image-data');
    const url = await uploadToR2(buffer);

    // Verify S3Client.send was called
    expect(mockSend).toHaveBeenCalledTimes(1);

    // Verify PutObjectCommand was passed with correct params
    const command = mockSend.mock.calls[0][0];
    expect(command.input).toEqual(
      expect.objectContaining({
        Bucket: 'test-bucket',
        Body: buffer,
        ContentType: 'image/png',
      }),
    );

    // Verify returned URL starts with public URL
    expect(url).toMatch(/^https:\/\/r2\.example\.com\/screenshots\/.+\.png$/);
  });
});
