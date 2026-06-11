const XLSX = require("xlsx");
const wb = XLSX.readFile("temp-extract.xlsx");
console.log("=== SHEETS ===");
wb.SheetNames.forEach((name, idx) => {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
  console.log(`\n--- Sheet ${idx + 1}: ${name} (${rows.length} rows) ---`);
  // Print all rows but truncate long ones
  rows.forEach((row, rIdx) => {
    if (row.length > 0) {
      const cols = row.map(c => {
        const s = String(c || "");
        return s.length > 120 ? s.substring(0, 120) + "..." : s;
      });
      console.log(`  R${rIdx + 1}: ${cols.join(" | ")}`);
    }
  });
});