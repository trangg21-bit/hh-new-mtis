// enforce-charset — Express middleware để đảm bảo TẤT CẢ JSON response
// đều có Content-Type: application/json; charset=utf-8
//
// Lý do: Express res.json() gọi res.type('json') — ghi đè Content-Type
// mà KHÔNG bao gồm charset → text tiếng Việt bị garbled.
// Middleware này:
//   1. Set res.charset = 'utf-8' (Express sẽ tự thêm vào header)
//   2. Override res.type() để force charset=utf-8 khi type === 'json'
//
// Usage:
//   const enforceCharset = require('./middleware/enforce-charset');
//   app.use(enforceCharset());
//
// Placement: TRƯỚC mọi route definitions

function enforceCharset() {
  return (req, res, next) => {
    // Set default charset for Express to include in all responses
    res.charset = 'utf-8';

    // Override res.type() to force charset on JSON responses
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
