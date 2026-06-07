const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ MTIS running at http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/#login`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/#dashboard`);
});
