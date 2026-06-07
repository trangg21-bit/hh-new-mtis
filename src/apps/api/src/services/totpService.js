const { authenticator } = require('otplib');
const QRCode = require('qrcode');

const ISSUER = 'MTIS';

function generateSecret() {
  return authenticator.generateSecret();
}

function generateOtpAuthUrl(username, secret) {
  return authenticator.keyuri(username, ISSUER, secret);
}

function generateQrCode(username, secret) {
  const otpauth = generateOtpAuthUrl(username, secret);
  return QRCode.toDataURL(otpauth);
}

function verifyToken(token, secret) {
  if (!secret) return false;
  return authenticator.verify({ token, secret });
}

module.exports = { generateSecret, generateOtpAuthUrl, generateQrCode, verifyToken };
