// -*- coding: utf-8 -*-
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = '8h';
const TOTP_TEMP_EXPIRES = '5m';

function signToken(payload, options) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES, ...options });
}

function signTotpTempToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOTP_TEMP_EXPIRES });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

module.exports = { signToken, signTotpTempToken, verifyToken, JWT_SECRET, JWT_EXPIRES, TOTP_TEMP_EXPIRES };
