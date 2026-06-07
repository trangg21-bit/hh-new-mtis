const bcrypt = require('bcryptjs');
const db = require('../db');

const BCRYPT_ROUNDS = 10;

function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  if (!/[A-Z]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ hoa');
  if (!/[a-z]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  if (!/[0-9]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  return errors;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function checkPasswordHistory(userId, newHash, keepCount) {
  keepCount = keepCount || 3;
  const history = db.prepare(
    'SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, keepCount);
  return history.some(h => h.password_hash === newHash);
}

function savePasswordHistory(userId, oldHash) {
  db.prepare('INSERT INTO password_history (user_id, password_hash) VALUES (?, ?)')
    .run(userId, oldHash);
}

function prunePasswordHistory(userId, keepCount) {
  keepCount = keepCount || 3;
  db.prepare(`
    DELETE FROM password_history WHERE id IN (
      SELECT id FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT -1 OFFSET ?
    )
  `).run(userId, keepCount);
}

module.exports = {
  validatePassword,
  hashPassword,
  verifyPassword,
  checkPasswordHistory,
  savePasswordHistory,
  prunePasswordHistory
};
