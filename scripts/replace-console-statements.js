/**
 * Script to replace console.log/error/warn with logger
 * Run with: node scripts/replace-console-statements.js
 *
 * This script helps identify remaining console statements
 * Manual replacement is still needed for context-specific logging
 */

const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '../src');
const filesToProcess = [];

// Find all JS/TS files with console statements
function findFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findFiles(filePath);
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (/console\.(log|error|warn|info|debug)/.test(content)) {
        filesToProcess.push({
          path: filePath,
          relativePath: path.relative(SRC_DIR, filePath),
          hasLogger: /import.*logger.*from/.test(content) || /require.*logger/.test(content),
        });
      }
    }
  });
}

findFiles(SRC_DIR);

console.log(`\n📊 Found ${filesToProcess.length} files with console statements:\n`);

filesToProcess.forEach((file, index) => {
  const status = file.hasLogger ? '✅' : '⚠️';
  console.log(`${index + 1}. ${status} ${file.relativePath}`);
});

console.log(`\n✅ Files already using logger: ${filesToProcess.filter((f) => f.hasLogger).length}`);
console.log(
  `⚠️  Files needing logger import: ${filesToProcess.filter((f) => !f.hasLogger).length}`
);

// Export for use in other scripts
module.exports = { filesToProcess };
