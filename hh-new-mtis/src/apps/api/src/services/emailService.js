// -*- coding: utf-8 -*-
const nodemailer = require('nodemailer');

// --- SMTP Transporter (lazy-init) --------------------------
const _tr = { instance: null };
function getTransporter() {
  if (_tr.instance) return _tr.instance;
  const smtp = {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
  };
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    smtp.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS };
  }
  _tr.instance = nodemailer.createTransport(smtp);
  return _tr.instance;
}

// --- Internal: actually send --------------------------------
async function sendMail(to, subject, html) {
  if (!process.env.SMTP_HOST) {
    // No SMTP configured � log only (dev/staging mode)
    // A3-L02: Consistent masking across all log lines
    const masked = to.replace(/^(.).*(@.*)$/, '$1***$2');
    console.log(JSON.stringify({ event: 'email_stub', to: masked, subject, level: 'info' }));
    return;
  }
  const from = process.env.SMTP_FROM || 'noreply@mtis.vn';
  const tr = getTransporter();
  const info = await tr.sendMail({ from, to, subject, html });
  // A3-L02: Mask email in success log too
  const masked = to.replace(/^(.).*(@.*)$/, '$1***$2');
  console.log(JSON.stringify({ event: 'email_sent', to: masked, subject, messageId: info.messageId, level: 'info' }));
}

// --- Forgot Password ----------------------------------------
async function sendForgotPasswordEmail(email, token) {
  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/#reset-password/${token}`;
  await sendMail(
    email,
    '�?t l?i m?t kh?u MTIS',
    `<p>B?n d� y�u c?u d?t l?i m?t kh?u cho t�i kho?n MTIS.</p>
     <p>Nh?n v�o link b�n du?i d? d?t l?i m?t kh?u (c� hi?u l?c trong 15 ph�t):</p>
     <p><a href="${resetLink}">�?t l?i m?t kh?u</a></p>
     <p>N?u b?n kh�ng y�u c?u, vui l�ng b? qua email n�y.</p>`
  );
}

module.exports = { sendMail, sendForgotPasswordEmail, getTransporter };
