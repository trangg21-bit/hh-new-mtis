// -*- coding: utf-8 -*-
const { generateSecret: otplibGenerateSecret, generateURI, verifySync } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');

const ISSUER = 'QL KCHT H�ng h?i';
const ENC_KEY = (() => {
  const k = process.env.TOTP_ENCRYPTION_KEY;
  if (k) return crypto.createHash('sha256').update(k).digest();
  return null; // no encryption key = plaintext fallback
})();

function encrypt(plaintext) {
  if (!ENC_KEY || !plaintext) return plaintext;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc.toString('hex')}`;
}

function decrypt(ciphertext) {
  if (!ENC_KEY || !ciphertext || !ciphertext.includes(':')) return ciphertext;
  try {
    const [ivHex, tagHex, encHex] = ciphertext.split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return ciphertext; // fallback for legacy plaintext secrets
  }
}

function generateSecret() {
  return otplibGenerateSecret({ length: 20 });
}

function generateOtpAuthUrl(username, secret) {
  return generateURI({ strategy: 'totp', issuer: ISSUER, label: username, secret, digits: 6, period: 30 });
}

function generateQrCode(username, secret) {
  const otpauth = generateOtpAuthUrl(username, secret);
  return QRCode.toDataURL(otpauth);
}

function verifyToken(token, secret) {
  if (!secret) return false;
  // RR-02: Fix type coercion � ensure both are strings before comparison
  const safeToken = String(token);
  const safeSecret = typeof secret === 'string' ? decrypt(secret) : secret;
  if (!safeSecret) return false;
  return verifySync({ strategy: 'totp', token: safeToken, secret: safeSecret, digits: 6, period: 30, epochTolerance: 1 });
}

module.exports = { generateSecret, generateOtpAuthUrl, generateQrCode, verifyToken, encrypt, decrypt };
