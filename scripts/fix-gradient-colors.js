#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Gradient replacements: mixed Colors constants + literals -> Colors.gradient constants
const gradientReplacements = [
  // Gold gradients
  {
    pattern: /\[Colors\.accent\.gold,\s*['"]#FFA500['"]\]/g,
    replacement: 'Colors.gradient.gold',
  },
  // Teal gradients
  {
    pattern: /\[Colors\.accent\.teal,\s*['"]#44A08D['"]\]/g,
    replacement: 'Colors.gradient.teal',
  },
  // Red gradients
  {
    pattern: /\[Colors\.accent\.red,\s*['"]#EE5A6F['"]\]/g,
    replacement: 'Colors.gradient.red',
  },
  // Red-orange gradients
  {
    pattern: /\[Colors\.accent\.red,\s*['"]#FF8E53['"]\]/g,
    replacement: 'Colors.gradient.redOrange',
  },
  // Purple gradients
  {
    pattern: /\[Colors\.accent\.purple,\s*['"]#7C3AED['"]\]/g,
    replacement: 'Colors.gradient.purple',
  },
  // Blue gradients
  {
    pattern: /\[Colors\.accent\.blue,\s*['"]#1D4ED8['"]\]/g,
    replacement: 'Colors.gradient.blue',
  },
  // Green gradients
  {
    pattern: /\[Colors\.accent\.green,\s*['"]#059669['"]\]/g,
    replacement: 'Colors.gradient.green',
  },
  // Disabled/placeholder gradients
  {
    pattern: /\[Colors\.text\.light,\s*['"]#bbb['"]\]/g,
    replacement: 'Colors.gradient.disabled',
  },
  // Success gradients
  {
    pattern: /\[Colors\.status\.success,\s*['"]#81C784['"]\]/g,
    replacement: 'Colors.gradient.success',
  },
  // Info gradients
  {
    pattern: /\[Colors\.status\.info,\s*['"]#64B5F6['"]\]/g,
    replacement: 'Colors.gradient.info',
  },
  // Login screen special gradient
  {
    pattern: /\[Colors\.primary,\s*Colors\.primaryDark,\s*['"]#f093fb['"]\]/g,
    replacement: '[Colors.primary, Colors.primaryDark, Colors.gradient.pink[0]]',
  },
];

function fixGradientsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const { pattern, replacement } of gradientReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }

  return false;
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let processedCount = 0;

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      processedCount += processDirectory(filePath);
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && fixGradientsInFile(filePath)) {
      processedCount++;
      console.log(`Fixed gradients: ${filePath}`);
    }
  }

  return processedCount;
}

const srcDir = path.join(__dirname, '../src');
console.log('Fixing gradient arrays with mixed Colors constants...');
const count = processDirectory(srcDir);
console.log(`\nFixed ${count} files.`);
