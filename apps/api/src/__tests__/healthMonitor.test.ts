import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Set env vars BEFORE importing the module (read at module load time)
process.env.HEALTH_ALERT_EMAIL = 'ops@bugsnap.dev';
process.env.HEALTH_ALERT_WEBHOOK_URL = 'https://hooks.example.com/alert';
process.env.HEALTH_ALERT_THRESHOLD = '3';
process.env.HEALTH_CHECK_INTERVAL_MS = '60000';

// Mock healthCheck module — getHealthReport is the only dependency we need to control
vi.mock('../services/healthCheck', () => ({
  getHealthReport: vi.fn(),
}));

import type { HealthReport } from '../services/healthCheck';
import { getHealthReport } from '../services/healthCheck';
import * as emailModule from '../services/emailService';
import { healthMonitor } from '../services/healthMonitor';

const mockGetHealthReport = getHealthReport as ReturnType<typeof vi.fn>;

// Spy on the emailService.sendEmail method on the module namespace object
const sendEmailSpy = vi.spyOn(emailModule.emailService, 'sendEmail').mockResolvedValue(undefined);

// Mock global fetch
const mockFetch = vi.fn().mockResolvedValue({ ok: true });
vi.stubGlobal('fetch', mockFetch);

function makeReport(status: HealthReport['status']): HealthReport {
  return {
    status,
    timestamp: new Date().toISOString(),
    components: {
      database: { status: status === 'unhealthy' ? 'unhealthy' : 'healthy', latencyMs: 5 },
      redis: { status: status === 'degraded' ? 'unhealthy' : 'unconfigured' },
      queues: { status: 'unconfigured' },
    },
  };
}

beforeEach(() => {
  healthMonitor._resetForTesting();
  mockGetHealthReport.mockClear();
  sendEmailSpy.mockClear();
  sendEmailSpy.mockResolvedValue(undefined);
  mockFetch.mockClear();
  mockFetch.mockResolvedValue({ ok: true });
});

afterEach(() => {
  healthMonitor.stop();
});

describe('HealthMonitor', () => {
  it('does not alert before threshold is reached', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));

    await healthMonitor.check();
    await healthMonitor.check();

    expect(sendEmailSpy).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('sends alert email after N consecutive failures', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));

    await healthMonitor.check();
    await healthMonitor.check();
    await healthMonitor.check();

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(sendEmailSpy).toHaveBeenCalledWith(
      'ops@bugsnap.dev',
      expect.stringContaining('Health Alert'),
      expect.stringContaining('Service Unhealthy'),
    );
  });

  it('sends webhook POST after threshold', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));

    await healthMonitor.check();
    await healthMonitor.check();
    await healthMonitor.check();

    expect(mockFetch).toHaveBeenCalledWith(
      'https://hooks.example.com/alert',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  });

  it('does not send duplicate alerts after threshold', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));

    for (let i = 0; i < 5; i++) {
      await healthMonitor.check();
    }

    expect(sendEmailSpy).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('sends recovery notification when service restores', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));

    await healthMonitor.check();
    await healthMonitor.check();
    await healthMonitor.check();

    mockGetHealthReport.mockResolvedValue(makeReport('healthy'));
    await healthMonitor.check();

    // Alert + recovery = 2 emails, 2 webhook calls
    expect(sendEmailSpy).toHaveBeenCalledTimes(2);
    expect(sendEmailSpy).toHaveBeenLastCalledWith(
      'ops@bugsnap.dev',
      expect.stringContaining('Recovery'),
      expect.stringContaining('Service Restored'),
    );
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('resets failure count on healthy check before threshold', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));
    await healthMonitor.check();
    await healthMonitor.check();

    mockGetHealthReport.mockResolvedValue(makeReport('healthy'));
    await healthMonitor.check();

    // Two more unhealthy — still not at threshold (count was reset)
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));
    await healthMonitor.check();
    await healthMonitor.check();

    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it('does not increment failures on degraded status', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('degraded'));

    for (let i = 0; i < 5; i++) {
      await healthMonitor.check();
    }

    expect(sendEmailSpy).not.toHaveBeenCalled();
  });

  it('handles email send failure gracefully', async () => {
    mockGetHealthReport.mockResolvedValue(makeReport('unhealthy'));
    sendEmailSpy.mockRejectedValue(new Error('Resend API error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await healthMonitor.check();
    await healthMonitor.check();
    await healthMonitor.check();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[health-monitor] Failed to send alert email:',
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it('start and stop manage the interval', async () => {
    vi.useFakeTimers();
    mockGetHealthReport.mockResolvedValue(makeReport('healthy'));

    healthMonitor.start();

    // Advance past the initial 5s delay
    await vi.advanceTimersByTimeAsync(5000);

    expect(mockGetHealthReport).toHaveBeenCalledTimes(1);

    healthMonitor.stop();

    // Advance further — no more calls
    mockGetHealthReport.mockClear();
    await vi.advanceTimersByTimeAsync(120000);
    expect(mockGetHealthReport).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
