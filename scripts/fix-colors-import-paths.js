#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImportPaths(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix wrong import path: '../constants/colors' -> '../../constants/colors'
  // This is for files in src/components/* subdirectories
  if (content.includes("from '../constants/colors'")) {
    // Check if file is in a subdirectory (like components/Card/, components/Chat/, etc.)
    const relativePath = path.relative(process.cwd(), filePath);
    const depth = relativePath.split(path.sep).length;
    
    // If file is in src/components/SomeSubdir/, it needs ../../constants/colors
    // If file is in src/components/, it needs ../constants/colors
    if (relativePath.includes('components/') && relativePath.split('/').length > 2) {
      content = content.replace(/from ['"]\.\.\/constants\/colors['"]/g, "from '../../constants/colors'");
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
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      if (fixImportPaths(filePath)) {
        processedCount++;
        console.log(`Fixed: ${filePath}`);
      }
    }
  }

  return processedCount;
}

const srcDir = path.join(__dirname, '../src/components');
console.log('Fixing Colors import paths in components...');
const count = processDirectory(srcDir);
console.log(`\nFixed ${count} files.`);
