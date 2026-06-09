const nodemailer = require('nodemailer');

// ─── SMTP Transporter (lazy-init) ──────────────────────────
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

// ─── Internal: actually send ────────────────────────────────
async function sendMail(to, subject, html) {
  if (!process.env.SMTP_HOST) {
    // No SMTP configured — log only (dev/staging mode)
    const masked = to.replace(/^(.).*(@.*)$/, '$1***$2');
    console.log(JSON.stringify({ event: 'email_stub', to: masked, subject }));
    return;
  }
  const from = process.env.SMTP_FROM || 'noreply@mtis.vn';
  const tr = getTransporter();
  const info = await tr.sendMail({ from, to, subject, html });
  console.log(JSON.stringify({ event: 'email_sent', to, subject, messageId: info.messageId }));
}

// ─── Forgot Password ────────────────────────────────────────
async function sendForgotPasswordEmail(email, token) {
  const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/#reset-password/${token}`;
  await sendMail(
    email,
    'Đặt lại mật khẩu MTIS',
    `<p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản MTIS.</p>
     <p>Nhấn vào link bên dưới để đặt lại mật khẩu (có hiệu lực trong 15 phút):</p>
     <p><a href="${resetLink}">Đặt lại mật khẩu</a></p>
     <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>`
  );
}

module.exports = { sendMail, sendForgotPasswordEmail, getTransporter };
