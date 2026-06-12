/**
 * Template: UTF-8 Charset Enforcement Middleware (JavaScript)
 *
 * Use this template to create charset middleware for any Express.js app.
 * Copy to src/middleware/ and apply BEFORE routes in app.js.
 *
 * Usage:
 *   const enforceCharset = require('./middleware/enforce-charset');
 *   app.use(enforceCharset());
 *
 * Why: Express res.json() → res.type('json') drops charset → Vietnamese text garbled.
 * This middleware forces charset=utf-8 on ALL JSON responses.
 */

function enforceCharset() {
  return (req, res, next) => {
    res.charset = 'utf-8';

    const originalType = res.type.bind(res);
    res.type = function (type) {
      if (type === 'json') {
        return this.set('Content-Type', 'application/json; charset=utf-8');
      }
      return originalType(type);
    };

    next();
  };
}

module.exports = enforceCharset;
