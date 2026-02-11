import { getHealthReport, type HealthReport } from './healthCheck';

function getConfig() {
  return {
    intervalMs: parseInt(process.env.HEALTH_CHECK_INTERVAL_MS || '60000', 10),
    threshold: parseInt(process.env.HEALTH_ALERT_THRESHOLD || '3', 10),
    alertEmail: process.env.HEALTH_ALERT_EMAIL || '',
    webhookUrl: process.env.HEALTH_ALERT_WEBHOOK_URL || '',
  };
}

class HealthMonitor {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private consecutiveFailures = 0;
  private alertSent = false;

  start(): void {
    if (this.timeoutId || this.intervalId) return;
    const { alertEmail, webhookUrl, intervalMs } = getConfig();

    if (!alertEmail && !webhookUrl) {
      console.log('[health-monitor] No alert channels configured — logging only');
    }

    // First check after 5s delay, then at regular interval
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.check();
      this.intervalId = setInterval(() => this.check(), intervalMs);
    }, 5000);
  }

  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /** Reset internal state — for testing only. */
  _resetForTesting(): void {
    this.stop();
    this.consecutiveFailures = 0;
    this.alertSent = false;
  }

  async check(): Promise<void> {
    const { threshold } = getConfig();
    let report: HealthReport;
    try {
      report = await getHealthReport();
    } catch (error) {
      console.error('[health-monitor] Failed to run health check:', error);
      return;
    }

    if (report.status === 'unhealthy') {
      this.consecutiveFailures++;
      console.warn(
        `[health-monitor] UNHEALTHY (${this.consecutiveFailures}/${threshold})`,
        JSON.stringify(report.components),
      );

      if (this.consecutiveFailures >= threshold && !this.alertSent) {
        this.alertSent = true;
        await this.sendAlert(report);
      }
    } else {
      // healthy or degraded
      if (report.status === 'degraded') {
        console.warn('[health-monitor] DEGRADED', JSON.stringify(report.components));
      }

      if (this.alertSent) {
        // Service recovered after alert was sent
        await this.sendRecovery(report);
      }

      this.consecutiveFailures = 0;
      this.alertSent = false;
    }
  }

  private async sendAlert(report: HealthReport): Promise<void> {
    const { webhookUrl } = getConfig();
    const payload = { type: 'alert', report };

    if (webhookUrl) {
      await this.postWebhook(webhookUrl, payload);
    }
  }

  private async sendRecovery(report: HealthReport): Promise<void> {
    const { webhookUrl } = getConfig();
    const payload = { type: 'recovery', report };

    if (webhookUrl) {
      await this.postWebhook(webhookUrl, payload);
    }
  }

  private async postWebhook(url: string, payload: Record<string, unknown>): Promise<void> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      console.log('[health-monitor] Webhook POST sent');
    } catch (error) {
      console.error('[health-monitor] Webhook POST failed:', error);
    }
  }

}

export const healthMonitor = new HealthMonitor();
