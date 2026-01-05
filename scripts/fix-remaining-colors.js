#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Additional color replacements
const colorReplacements = [
  // Status light colors
  { pattern: /['"]#E8F5E9['"]/g, replacement: 'Colors.status.successLight' },
  { pattern: /['"]#FFF3E0['"]/g, replacement: 'Colors.status.warningLight' },
  { pattern: /['"]#FFEBEE['"]/g, replacement: 'Colors.status.errorLight' },
  { pattern: /['"]#E3F2FD['"]/g, replacement: 'Colors.status.infoLight' },
  { pattern: /['"]#E8F0FE['"]/g, replacement: 'Colors.status.infoLight' },
  // Status dark colors
  { pattern: /['"]#2E7D32['"]/g, replacement: 'Colors.status.successDark' },
  { pattern: /['"]#1565C0['"]/g, replacement: 'Colors.status.infoBlue' },
  { pattern: /['"]#F59E0B['"]/g, replacement: 'Colors.status.warningOrange' },
  // Purple variants
  { pattern: /['"]#9C27B0['"]/g, replacement: 'Colors.gamification.socialButterfly' },
  { pattern: /['"]#7B1FA2['"]/g, replacement: 'Colors.gamification.socialButterfly' },
  { pattern: /['"]#BA68C8['"]/g, replacement: 'Colors.gamification.socialButterfly' },
  // Gold/yellow variants
  { pattern: /['"]#FFF8E1['"]/g, replacement: 'Colors.status.warningLight' },
  { pattern: /['"]#F57F17['"]/g, replacement: 'Colors.status.warningDark' },
  // Background light variants
  { pattern: /['"]#e0e0e0['"]/g, replacement: 'Colors.ui.disabled' },
];

function fixColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if Colors is imported
  const hasColorsImport =
    content.includes("from '../constants/colors'") ||
    content.includes('from "../constants/colors"') ||
    content.includes("from './constants/colors'") ||
    content.includes('from "./constants/colors"');

  for (const { pattern, replacement } of colorReplacements) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      modified = true;
    }
  }

  // Add Colors import if needed
  if (modified && !hasColorsImport) {
    const importMatch = content.match(/^import .+ from ['"].+['"];$/m);
    if (importMatch) {
      const lastImportIndex = content.lastIndexOf(importMatch[0]);
      const insertIndex = content.indexOf('\n', lastImportIndex) + 1;

      let importPath = '../constants/colors';
      if (filePath.includes('/screens/')) {
        importPath = '../constants/colors';
      } else if (filePath.includes('/components/')) {
        importPath = '../constants/colors';
      } else if (filePath.includes('/services/')) {
        importPath = '../constants/colors';
      }

      content =
        content.slice(0, insertIndex) +
        `import { Colors } from '${importPath}';\n` +
        content.slice(insertIndex);
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
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && fixColorsInFile(filePath)) {
      processedCount++;
      console.log(`Fixed: ${filePath}`);
    }
  }

  return processedCount;
}

const srcDir = path.join(__dirname, '../src');
console.log('Fixing remaining hardcoded colors...');
const count = processDirectory(srcDir);
console.log(`\nFixed ${count} files.`);
