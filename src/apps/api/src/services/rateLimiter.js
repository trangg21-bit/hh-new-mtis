const registry = new Map();

function getKey(identifier) {
  return String(identifier).toLowerCase();
}

function isRateLimited(identifier, maxAttempts, windowMs) {
  const key = getKey(identifier);
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = registry.get(key);
  if (!entry) return false;

  const recent = entry.attempts.filter(ts => ts > cutoff);
  entry.attempts = recent;
  registry.set(key, entry);

  return recent.length >= maxAttempts;
}

function recordAttempt(identifier) {
  const key = getKey(identifier);
  const now = Date.now();

  const entry = registry.get(key);
  if (entry) {
    entry.attempts.push(now);
  } else {
    registry.set(key, { attempts: [now] });
  }
}

function getRemaining(identifier, maxAttempts, windowMs) {
  const key = getKey(identifier);
  const now = Date.now();
  const cutoff = now - windowMs;

  const entry = registry.get(key);
  if (!entry) return maxAttempts;

  const recent = entry.attempts.filter(ts => ts > cutoff);
  return Math.max(0, maxAttempts - recent.length);
}

function reset(identifier) {
  registry.delete(getKey(identifier));
}

module.exports = { isRateLimited, recordAttempt, getRemaining, reset };
