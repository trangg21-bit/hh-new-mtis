#!/usr/bin/env node
// -*- coding: utf-8 -*-
/**
 * check-encoding.ts — Quét & sửa lỗi encoding trong docs/ui/ và src/apps/api/src/
 *
 * Hoạt động:
 *  1. Quét toàn bộ file .js, .json, .css, .html, .md, .svg trong hai thư mục mục tiêu
 *  2. Phát hiện file Windows-1258 / ANSI / corrupt UTF-8
 *  3. Tự động fix: convert sang UTF-8 (không BOM)
 *  4. Ghi báo cáo chi tiết vào .ai-kit/logs/encoding-report.json
 *  5. Log ra console danh sách file đã fix
 */

const fs = require('fs');
const path = require('path');

// ─── Config ──────────────────────────────────────────────────
const WORKSPACE = path.resolve(__dirname, '..', '..'); // hh-new-mtis root
const SCAN_DIRS = [
  path.join(WORKSPACE, 'docs', 'ui'),
  path.join(WORKSPACE, 'src', 'apps', 'api', 'src'),
];
const EXTENSIONS = new Set(['.js', '.json', '.css', '.html', '.md', '.svg', '.txt', '.yml', '.yaml']);
const REPORT_PATH = path.join(WORKSPACE, '.ai-kit', 'logs', 'encoding-report.json');

// ─── Helpers ─────────────────────────────────────────────────

/** Flatten directory tree to list of file paths */
function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function _walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '__pycache__') continue;
        _walk(full);
      } else {
        results.push(full);
      }
    }
  }
  _walk(dir);
  return results;
}

/** Check if a buffer starts with UTF-8 BOM (EF BB BF) */
function hasUtf8Bom(buf) {
  return buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
}

/**
 * Detect encoding issues in a file buffer.
 * Returns { encoding, bom, issues: string[], isCorrupt: boolean }
 */
function detectEncoding(buf) {
  const result = {
    encoding: 'utf-8',
    bom: hasUtf8Bom(buf),
    issues: [],
    isCorrupt: false,
  };

  // 1. Check for Windows-1258 BOM (00 00 FE FF = UTF-32 BE BOM, rare but possible mislabel)
  if (buf.length >= 4 && buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0xFE && buf[3] === 0xFF) {
    result.encoding = 'utf-32-be-bom';
    result.isCorrupt = true;
    result.issues.push('Detected UTF-32 BE BOM — should be UTF-8');
    return result;
  }

  // 2. Check for ANSI/Windows-1258 markers (no UTF-8 signature but has high-byte chars)
  const bomBytes = hasUtf8Bom(buf) ? buf.slice(3) : buf;

  // Check for ANSI BOM patterns (FE FF = UTF-16 LE BOM)
  if (bomBytes.length >= 2 && bomBytes[0] === 0xFE && bomBytes[1] === 0xFF) {
    result.encoding = 'utf-16-le-bom';
    result.isCorrupt = true;
    result.issues.push('Detected UTF-16 LE BOM — should be UTF-8');
    return result;
  }

  // 3. Try to decode as UTF-8 — if it fails, file is corrupt
  try {
    const text = buf.toString('utf-8');
    // Re-encode to verify round-trip integrity
    const reencoded = Buffer.from(text, 'utf-8');
    if (!reencoded.equals(bomBytes)) {
      // Check if this is a UTF-16 LE file (common for SVG files saved by Windows editors)
      // Pattern: every other byte is 0x00 (ASCII in UTF-16 LE)
      let looksLikeUtf16 = false;
      if (bomBytes.length >= 4 && (bomBytes[0] === 0xFF && bomBytes[1] === 0xFE || bomBytes[0] === 0xFE && bomBytes[1] === 0xFF)) {
        // Already detected as UTF-16 BOM above, so this must be something else
        looksLikeUtf16 = false;
      } else if (bomBytes.length >= 6) {
        // Check if every even byte is ASCII and odd bytes are null (UTF-16 LE without BOM)
        let nullCount = 0;
        for (let i = 1; i < Math.min(bomBytes.length, 100); i += 2) {
          if (bomBytes[i] === 0x00) nullCount++;
        }
        if (nullCount > Math.min(bomBytes.length, 100) / 2 * 0.7) {
          looksLikeUtf16 = true;
        }
      }
      if (looksLikeUtf16) {
        // Convert UTF-16 LE → UTF-8
        const utf16Text = bomBytes.toString('utf-16le');
        const utf8Buf = Buffer.from(utf16Text, 'utf-8');
        fs.writeFileSync(filePath, utf8Buf, 'utf-8');
        result.encoding = 'utf-16-le';
        result.isCorrupt = true;
        result.issues.push('Detected UTF-16 LE encoding — converted to UTF-8');
        return result;
      }
      // Round-trip loss detected: some bytes were replaced with replacement char
      result.isCorrupt = true;
      result.encoding = 'corrupt-utf-8';
      result.issues.push('UTF-8 decode/re-encode round-trip mismatch — file is corrupt');
      return result;
    }
    // Check for common Windows-1258 byte patterns (Vietnamese characters encoded in Win-1258 instead of UTF-8)
    // UTF-8 Vietnamese characters: 2-byte sequences starting with C2-C4
    // Windows-1258 Vietnamese: single bytes in D0-E1 range
    let hasWin1258Pattern = false;
    for (let i = 0; i < bomBytes.length; i++) {
      const b = bomBytes[i];
      // Windows-1258 uses 0xD0-0xE1 for Vietnamese uppercase (Ă, Â, Ê, Ô, etc.)
      if (b >= 0xD0 && b <= 0xE1) {
        // Check next byte to distinguish from UTF-8 multi-byte
        // UTF-8 continuation bytes are 0x80-0xBF
        // Windows-1258 single-byte chars are standalone
        const next = i + 1 < bomBytes.length ? bomBytes[i + 1] : 0;
        if (next < 0x80 || next > 0xBF) {
          hasWin1258Pattern = true;
          break;
        }
      }
      // Windows-1258 Vietnamese lowercase: 0xC2-0xCF (Ă, â, ê, ô, ơ, ư, đ)
      if (b >= 0xC2 && b <= 0xCF) {
        const next = i + 1 < bomBytes.length ? bomBytes[i + 1] : 0;
        if (next < 0x80 || next > 0xBF) {
          hasWin1258Pattern = true;
          break;
        }
      }
    }

    if (hasWin1258Pattern) {
      result.encoding = 'windows-1258';
      result.isCorrupt = true;
      result.issues.push('Detected Windows-1258 encoding pattern — Vietnamese text likely corrupt');
      return result;
    }

    // File is valid UTF-8
    result.encoding = 'utf-8';
  } catch (e) {
    result.encoding = 'invalid-utf-8';
    result.isCorrupt = true;
    result.issues.push(`UTF-8 decode failed: ${e.message}`);
  }

  return result;
}

/**
 * Fix a file: convert Windows-1258 → UTF-8, remove invalid BOMs
 */
function fixFile(filePath) {
  const buf = fs.readFileSync(filePath);
  const bomBytes = hasUtf8Bom(buf) ? buf.slice(3) : buf;

  // Fix 1: Remove any non-UTF-8 BOM or convert UTF-16 LE
  if (bomBytes.length >= 2 && bomBytes[0] === 0xFE && bomBytes[1] === 0xFF) {
    // UTF-16 LE BOM → remove and decode as UTF-8
    const withoutBom = bomBytes.slice(2);
    const text = withoutBom.toString('utf-8');
    fs.writeFileSync(filePath, text, 'utf-8');
    return 'removed-utf16-bom';
  }
  if (bomBytes.length >= 4 && bomBytes[0] === 0xFF && bomBytes[1] === 0xFE) {
    // UTF-16 LE without standard BOM (FF FE at start = BOM)
    const withoutBom = bomBytes.slice(2);
    const utf16Text = withoutBom.toString('utf-16le');
    const utf8Buf = Buffer.from(utf16Text, 'utf-8');
    fs.writeFileSync(filePath, utf8Buf, 'utf-8');
    return 'converted-utf16le-no-bom';
  }

  if (bomBytes.length >= 4 && bomBytes[0] === 0x00 && bomBytes[1] === 0x00 && bomBytes[2] === 0xFE && bomBytes[3] === 0xFF) {
    // UTF-32 BE BOM — just strip and hope for the best (rare)
    const withoutBom = bomBytes.slice(4);
    fs.writeFileSync(filePath, withoutBom.toString('utf-8'), 'utf-8');
    return 'removed-utf32-bom';
  }

  // Fix 2: Windows-1258 → UTF-8 conversion
  const analysis = detectEncoding(buf);
  if (analysis.encoding === 'windows-1258' && !analysis.isCorrupt) {
    const textWin1258 = buf.toString('binary');
    const textUtf8 = Buffer.from(textWin1258, 'binary').toString('utf-8');
    fs.writeFileSync(filePath, textUtf8, 'utf-8');
    return 'converted-win1258-to-utf8';
  }

  // Fix 3: Remove UTF-8 BOM if present (not needed for web files)
  if (hasUtf8Bom(buf)) {
    const withoutBom = buf.slice(3);
    fs.writeFileSync(filePath, withoutBom, 'utf-8');
    return 'removed-utf8-bom';
  }

  return null; // No fix needed
}

// ─── Main ────────────────────────────────────────────────────

function main() {
  const report = {
    timestamp: new Date().toISOString(),
    workspace: WORKSPACE,
    scanDirectories: SCAN_DIRS.map(d => path.relative(WORKSPACE, d)),
    files: [],
    summary: {
      total: 0,
      valid: 0,
      fixed: 0,
      errors: 0,
    },
  };

  // Ensure log directory exists
  const logDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  console.log(`🔍 Encoding Check — Workspace: ${path.relative('.', WORKSPACE)}`);
  console.log(`   Scanning: ${SCAN_DIRS.length} directories\n`);

  for (const scanDir of SCAN_DIRS) {
    if (!fs.existsSync(scanDir)) {
      console.warn(`   ⚠️  Directory not found: ${path.relative(WORKSPACE, scanDir)}`);
      continue;
    }

    const files = walkDir(scanDir);
    for (const filePath of files) {
      const relPath = path.relative(WORKSPACE, filePath);
      const ext = path.extname(filePath).toLowerCase();

      // Skip non-target extensions
      if (!EXTENSIONS.has(ext)) continue;

      report.summary.total++;

      try {
        const buf = fs.readFileSync(filePath);
        const analysis = detectEncoding(buf);

        const entry = {
          file: relPath,
          encoding: analysis.encoding,
          bom: analysis.bom,
          issues: analysis.issues,
          isCorrupt: analysis.isCorrupt,
          sizeBytes: buf.length,
        };

        if (analysis.isCorrupt) {
          const fixResult = fixFile(filePath);
          if (fixResult) {
            entry.fixedBy = fixResult;
            entry.fixed = true;
            report.summary.fixed++;
            console.log(`   ✅ [FIXED] ${relPath} → ${fixResult}`);
          } else {
            entry.fixed = false;
            report.summary.errors++;
            console.log(`   ❌ [ERROR]  ${relPath} — ${analysis.issues.join('; ')}`);
          }
        } else {
          entry.fixed = false;
          report.summary.valid++;
        }

        report.files.push(entry);
      } catch (e) {
        report.summary.errors++;
        report.files.push({
          file: relPath,
          encoding: 'error',
          bom: false,
          issues: [`Read error: ${e.message}`],
          isCorrupt: true,
          fixed: false,
          sizeBytes: 0,
        });
        console.log(`   ❌ [ERROR]  ${relPath} — ${e.message}`);
      }
    }
  }

  // Write report
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8');

  // Summary
  console.log(`\n📊 Summary`);
  console.log(`   Total files scanned: ${report.summary.total}`);
  console.log(`   ✅ Valid UTF-8:       ${report.summary.valid}`);
  console.log(`   🔧 Fixed:            ${report.summary.fixed}`);
  console.log(`   ❌ Errors:           ${report.summary.errors}`);
  console.log(`\n📄 Report saved to: ${path.relative(WORKSPACE, REPORT_PATH)}`);

  // Return fixed files list (for programmatic use)
  const fixedFiles = report.files
    .filter(f => f.fixed)
    .map(f => f.file);

  return {
    summary: report.summary,
    fixedFiles,
    reportPath: REPORT_PATH,
  };
}

// Run
const result = main();

// Exit with error code if there were unfixable errors
if (result.summary.errors > 0) {
  process.exit(1);
}

// Export for programmatic use (if required as module)
if (typeof module !== 'undefined') {
  module.exports = { main, detectEncoding, fixFile, walkDir };
}
