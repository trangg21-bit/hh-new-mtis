function sendEmail(to, subject, body) {
  const masked = to.replace(/^(.).*(@.*)$/, '$1***$2');
  console.log(JSON.stringify({ event: 'email_sent', to: masked, subject }));
}

function sendForgotPasswordEmail(email, token) {
  sendEmail(email, 'Đặt lại mật khẩu MTIS', `Token: ${token}`);
}

module.exports = { sendEmail, sendForgotPasswordEmail };
