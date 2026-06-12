// enforce-charset — Express middleware đảm bảo TẤT CẢ JSON response
// đều có Content-Type: application/json; charset=utf-8
//
// Cách hoạt động: Override res.json() để set header TRƯỚC khi Express
// gửi response. Đây là cách đảm bảo nhất vì Express gọi res.json()
// trong mọi route response.
//
// Usage:
//   const enforceCharset = require('./middleware/enforce-charset');
//   app.use(enforceCharset());
//
// Placement: TRƯỚC mọi route definitions

function enforceCharset() {
  return (req, res, next) => {
    // Set default charset
    res.charset = 'utf-8';

    // Override res.json() directly — guaranteed to be called for all JSON responses
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      // Set Content-Type with charset BEFORE calling originalJson
      this.set('Content-Type', 'application/json; charset=utf-8');
      return originalJson(body);
    };

    next();
  };
}

module.exports = enforceCharset;
