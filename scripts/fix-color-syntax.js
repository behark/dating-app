#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixColorSyntax(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix color=Colors. to color={Colors.
  const colorPattern = /color=Colors\.([a-zA-Z0-9_.]+)/g;
  if (colorPattern.test(content)) {
    content = content.replace(/color=Colors\.([a-zA-Z0-9_.]+)/g, 'color={Colors.$1}');
    modified = true;
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
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && fixColorSyntax(filePath)) {
      processedCount++;
      console.log(`Fixed: ${filePath}`);
    }
  }

  return processedCount;
}

const srcDir = path.join(__dirname, '../src');
console.log('Fixing color syntax errors...');
const count = processDirectory(srcDir);
console.log(`\nFixed ${count} files.`);
