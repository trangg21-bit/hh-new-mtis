// -*- coding: utf-8 -*-
// M01 � SRE Alerting Webhook Notifier
// services/alertService.js

const crypto = require('crypto');

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;
const ALERT_SILENCE_PERIOD = 5 * 60 * 1000; // 5 min � prevent alert storm

const _sentAlerts = new Map();

/**
 * Check if alert was recently sent (silence period)
 */
function isAlertSilenced(eventType, identifier) {
  const key = `${eventType}:${identifier}`;
  const lastSent = _sentAlerts.get(key);
  if (lastSent && Date.now() - lastSent < ALERT_SILENCE_PERIOD) {
    return true;
  }
  return false;
}

/**
 * Mark alert as sent
 */
function markAlertSent(eventType, identifier) {
  const key = `${eventType}:${identifier}`;
  _sentAlerts.set(key, Date.now());
}

/**
 * Send alert webhook (Slack/Teams)
 */
async function sendAlertWebhook(severity, title, message, details = {}) {
  if (!ALERT_WEBHOOK_URL) {
    console.log(JSON.stringify({ event: 'alert_webhook_disabled', title }));
    return;
  }

  const alertKey = `${severity}:${title}`;
  if (isAlertSilenced(alertKey, 'webhook')) {
    return;
  }

  const payload = {
    text: `[${severity.toUpperCase()}] ${title}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `?? ${severity.toUpperCase()}: ${title}`,
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*MTIS Alert*\n${message}`,
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: `? ${new Date().toISOString()} | ?? ${alertKey}`,
          },
          {
            type: 'plain_text',
            text: `?? Severity: ${severity}`,
          }
        ]
      }
    ]
  };

  try {
    await fetch(ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    markAlertSent(alertKey, 'webhook');
    console.log(JSON.stringify({ event: 'alert_sent', severity, title }));
  } catch (err) {
    console.error(JSON.stringify({ event: 'alert_send_failed', error: err.message }));
  }
}

/**
 * Alert on account lockout (5 failed login attempts)
 */
function alertAccountLockout(username) {
  sendAlertWebhook(
    'HIGH',
    'Account Lockout',
    `Account locked: ${username}. Possible brute-force attack.`,
    { username, action: 'lockout' }
  );
}

/**
 * Alert on rate limit spike
 */
function alertRateLimitSpike(route, count) {
  sendAlertWebhook(
    'MEDIUM',
    'Rate Limit Spike',
    `High request rate detected on ${route}: ${count} requests`,
    { route, count }
  );
}

/**
 * Alert on DB error
 */
function alertDbError(operation, error) {
  sendAlertWebhook(
    'CRITICAL',
    'Database Error',
    `DB operation failed: ${operation}. Error: ${error}`,
    { operation, error }
  );
}

/**
 * Alert on auth middleware failure (JWT invalid / session missing)
 */
function alertAuthFailure(username, reason) {
  sendAlertWebhook(
    'HIGH',
    'Authentication Failure',
    `Auth issue for ${username}: ${reason}`,
    { username, reason }
  );
}

module.exports = {
  sendAlertWebhook,
  alertAccountLockout,
  alertRateLimitSpike,
  alertDbError,
  alertAuthFailure,
};
