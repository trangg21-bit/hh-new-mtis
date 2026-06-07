function sendEmail(to, subject, body) {
  console.log(`[EMAIL] To: ${to} Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${body}`);
}

function sendForgotPasswordEmail(email, token) {
  const link = `http://localhost:3000/#reset-password/${token}`;
  sendEmail(email, 'Đặt lại mật khẩu MTIS', `Token: ${token}\nLink: ${link}`);
}

module.exports = { sendEmail, sendForgotPasswordEmail };
