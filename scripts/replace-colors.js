#!/usr/bin/env node

/**
 * Script to replace hardcoded color literals with Colors constants
 * This helps maintain consistency and makes dark mode implementation easier
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Constants for repeated color paths
const COLORS_TEXT_LIGHT = 'Colors.text.light';
const COLORS_BACKGROUND_WHITE = 'Colors.background.white';
const COLORS_TEXT_DARK = 'Colors.text.dark';
const COLORS_TEXT_SECONDARY = 'Colors.text.secondary';
const COLORS_TEXT_TERTIARY = 'Colors.text.tertiary';
const COLORS_TEXT_MEDIUM = 'Colors.text.medium';
const COLORS_BORDER_LIGHT = 'Colors.border.light';

// Color mapping: hardcoded color -> Colors constant path
const colorMap = {
  // Common colors
  "'#fff'": COLORS_BACKGROUND_WHITE,
  '"#fff"': COLORS_BACKGROUND_WHITE,
  "'#FFF'": COLORS_BACKGROUND_WHITE,
  '"#FFF"': COLORS_BACKGROUND_WHITE,
  "'#ffffff'": COLORS_BACKGROUND_WHITE,
  '"#FFFFFF"': COLORS_BACKGROUND_WHITE,
  "'#000'": 'Colors.text.primary',
  "'#000000'": 'Colors.text.primary',
  "'#333'": COLORS_TEXT_DARK,
  '"#333"': COLORS_TEXT_DARK,
  "'#666'": COLORS_TEXT_SECONDARY,
  '"#666"': COLORS_TEXT_SECONDARY,
  "'#999'": COLORS_TEXT_TERTIARY,
  '"#999"': COLORS_TEXT_TERTIARY,
  "'#555'": COLORS_TEXT_MEDIUM,
  '"#555"': COLORS_TEXT_MEDIUM,
  "'#ccc'": COLORS_TEXT_LIGHT,
  '"#ccc"': COLORS_TEXT_LIGHT,
  "'#CCC'": COLORS_TEXT_LIGHT,
  "'#ddd'": COLORS_BORDER_LIGHT,
  '"#ddd"': COLORS_BORDER_LIGHT,
  "'#DDD'": 'Colors.border.light',
  "'#eee'": 'Colors.text.lighter',
  "'#EEE'": 'Colors.text.lighter',

  // Primary colors
  "'#667eea'": 'Colors.primary',
  '"#667eea"': 'Colors.primary',
  "'#667EEA'": 'Colors.primary',
  "'#764ba2'": 'Colors.primaryDark',
  '"#764ba2"': 'Colors.primaryDark',
  "'#764BA2'": 'Colors.primaryDark',

  // Accent colors
  "'#FF6B6B'": 'Colors.accent.red',
  '"#FF6B6B"': 'Colors.accent.red',
  "'#FF6B9D'": 'Colors.accent.pink',
  '"#FF6B9D"': 'Colors.accent.pink',
  "'#FFD700'": 'Colors.accent.gold',
  '"#FFD700"': 'Colors.accent.gold',
  "'#4ECDC4'": 'Colors.accent.teal',
  '"#4ECDC4"': 'Colors.accent.teal',
  "'#8B5CF6'": 'Colors.accent.purple',
  "'#FF9800'": 'Colors.status.warning',
  '"#FF9800"': 'Colors.status.warning',
  "'#3B82F6'": 'Colors.accent.blue',
  "'#10B981'": 'Colors.accent.green',

  // Status colors
  "'#4CAF50'": 'Colors.status.success',
  '"#4CAF50"': 'Colors.status.success',
  "'#F44336'": 'Colors.status.error',
  '"#F44336"': 'Colors.status.error',
  "'#2196F3'": 'Colors.status.info',

  // Background colors
  "'#f0f0f0'": 'Colors.background.light',
  '"#f0f0f0"': 'Colors.background.light',
  "'#F0F0F0'": 'Colors.background.light',
  "'#f5f5f5'": 'Colors.background.lighter',
  '"#f5f5f5"': 'Colors.background.lighter',
  "'#F5F5F5'": 'Colors.background.lighter',
  "'#f8f9fa'": 'Colors.background.lightest',
  '"#f8f9fa"': 'Colors.background.lightest',
  "'#F8F9FA'": 'Colors.background.lightest',
  "'#e9ecef'": 'Colors.background.gray',
  '"#e9ecef"': 'Colors.background.gray',
};

// Note: #e9ecef can also map to Colors.border.gray - using background.gray as default

// Gradient arrays
const gradientMap = {
  "['#667eea', '#764ba2']": 'Colors.gradient.primary',
  '["#667eea", "#764ba2"]': 'Colors.gradient.primary',
  "['#f5f7fa', '#c3cfe2']": 'Colors.gradient.light',
  '["#f5f7fa", "#c3cfe2"]': 'Colors.gradient.light',
};

function addColorsImport(content, filePath) {
  const importMatch = content.match(/^import .+ from ['"].+['"];$/m);
  if (!importMatch) return content;

  const lastImportIndex = content.lastIndexOf(importMatch[0]);
  const insertIndex = content.indexOf('\n', lastImportIndex) + 1;
  const importPath = determineImportPath(filePath);

  return `${content.slice(0, insertIndex)}import { Colors } from '${importPath}';\n${content.slice(insertIndex)}`;
}

function determineImportPath(filePath) {
  // For most files, the relative path is the same
  return '../constants/colors';
}

function replaceColorsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Check if Colors is already imported
  const hasColorsImport =
    content.includes("from '../constants/colors'") ||
    content.includes('from "../constants/colors"') ||
    content.includes("from './constants/colors'") ||
    content.includes('from "./constants/colors"');

  // Replace gradient arrays first
  for (const [oldGradient, newGradient] of Object.entries(gradientMap)) {
    if (content.includes(oldGradient)) {
      content = content.replace(
        new RegExp(oldGradient.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newGradient
      );
      modified = true;
    }
  }

  // Replace individual colors
  for (const [oldColor, newColor] of Object.entries(colorMap)) {
    if (content.includes(oldColor)) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      content = content.replace(regex, newColor);
      modified = true;
    }
  }

  // Add Colors import if needed and file was modified
  if (modified && !hasColorsImport) {
    content = addColorsImport(content, filePath);
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
    } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && replaceColorsInFile(filePath)) {
      processedCount++;
      console.log(`Processed: ${filePath}`);
    }
  }

  return processedCount;
}

// Main execution
const srcDir = path.join(__dirname, '../src');
console.log('Starting color replacement...');
const count = processDirectory(srcDir);
console.log(`\nProcessed ${count} files.`);
