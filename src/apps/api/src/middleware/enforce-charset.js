/**
 * enforce-charset — Middleware Guardrail 2
 * 
 * Ensures ALL API responses include Content-Type: charset=utf-8
 * Applied globally after express.json() to cover all routes.
 * 
 * Guardrail 2: If any route forgets to set charset, this middleware
 * will enforce it before the response is sent.
 */
function enforceCharset(req, res, next) {
  // Store original methods
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json() to always include charset=utf-8
  res.json = function(body) {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    return originalJson(body);
  };

  // Override res.send() for text/HTML responses
  res.send = function(body) {
    if (!res.headersSent) {
      const contentType = res.getHeader('Content-Type');
      if (contentType && typeof contentType === 'string') {
        // Add charset if not already present
        if (!contentType.includes('charset=')) {
          if (contentType.includes('text/') || contentType.includes('application/json')) {
            res.setHeader('Content-Type', contentType + '; charset=utf-8');
          }
        }
      } else {
        // Default to JSON with charset if no Content-Type set
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      }
    }
    return originalSend(body);
  };

  // Also hook into res.end() for edge cases
  const originalEnd = res.end.bind(res);
  res.end = function(chunk, encoding) {
    if (!res.headersSent) {
      const contentType = res.getHeader('Content-Type');
      if (!contentType) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (typeof contentType === 'string' && !contentType.includes('charset=')) {
        if (contentType.includes('text/') || contentType.includes('application/')) {
          res.setHeader('Content-Type', contentType + '; charset=utf-8');
        }
      }
    }
    return originalEnd(chunk, encoding);
  };

  next();
}

module.exports = enforceCharset;
