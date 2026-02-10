import { getHealthReport, type HealthReport } from './healthCheck';
import * as emailModule from './emailService';

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
    const { alertEmail, webhookUrl } = getConfig();
    const subject = '[BugSnap] Health Alert — Service Unhealthy';
    const html = this.buildEmailHtml('alert', report);
    const payload = { type: 'alert', report };

    if (alertEmail) {
      try {
        await emailModule.emailService.sendEmail(alertEmail, subject, html);
        console.log('[health-monitor] Alert email sent');
      } catch (error) {
        console.error('[health-monitor] Failed to send alert email:', error);
      }
    }

    if (webhookUrl) {
      await this.postWebhook(webhookUrl, payload);
    }
  }

  private async sendRecovery(report: HealthReport): Promise<void> {
    const { alertEmail, webhookUrl } = getConfig();
    const subject = '[BugSnap] Recovery — Service Restored';
    const html = this.buildEmailHtml('recovery', report);
    const payload = { type: 'recovery', report };

    if (alertEmail) {
      try {
        await emailModule.emailService.sendEmail(alertEmail, subject, html);
        console.log('[health-monitor] Recovery email sent');
      } catch (error) {
        console.error('[health-monitor] Failed to send recovery email:', error);
      }
    }

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

  private buildEmailHtml(type: 'alert' | 'recovery', report: HealthReport): string {
    const color = type === 'alert' ? '#dc2626' : '#16a34a';
    const title = type === 'alert' ? 'Service Unhealthy' : 'Service Restored';

    const rows = Object.entries(report.components)
      .map(([name, comp]) => {
        const statusColor =
          comp.status === 'healthy' ? '#16a34a' :
          comp.status === 'unhealthy' ? '#dc2626' : '#9ca3af';
        return `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:${statusColor};font-weight:600;">${comp.status}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${comp.latencyMs != null ? comp.latencyMs + 'ms' : '—'}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${comp.message || '—'}</td>
        </tr>`;
      })
      .join('');

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color:${color};padding:24px;text-align:center;">
              <span style="color:#ffffff;font-size:20px;font-weight:bold;">BugSnap — ${title}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <p style="margin:0 0 8px;color:#4b5563;font-size:14px;">Overall status: <strong>${report.status}</strong></p>
              <p style="margin:0 0 16px;color:#6b7280;font-size:13px;">${report.timestamp}</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;border:1px solid #e5e7eb;border-radius:4px;">
                <tr style="background-color:#f9fafb;">
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Component</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Status</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Latency</th>
                  <th style="padding:8px 12px;text-align:left;border-bottom:1px solid #e5e7eb;">Message</th>
                </tr>
                ${rows}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}

export const healthMonitor = new HealthMonitor();
