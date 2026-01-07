#!/usr/bin/env node

/**
 * API Response Standardization Script
 * Replaces direct res.status().json() calls with responseHelpers utilities
 */

const fs = require('fs');
const path = require('path');

const CONTROLLERS_DIR = path.join(__dirname, '../controllers');
const responseHelpersImport = `const {
  sendSuccess,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendRateLimit,
  asyncHandler,
} = require('../utils/responseHelpers');`;

function standardizeController(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const fileName = path.basename(filePath);
  let modified = false;

  // Check if responseHelpers is already imported
  const hasResponseHelpers = content.includes('responseHelpers');

  // Add responseHelpers import if not present
  if (!hasResponseHelpers) {
    // Find a good place to insert (after other requires)
    const requireMatch = content.match(/(const .+ = require\([^)]+\);[\s\n]*)+/);
    if (requireMatch) {
      const lastRequire = requireMatch[0].trim().split('\n').pop();
      const lastRequireIndex = content.lastIndexOf(lastRequire) + lastRequire.length;
      content = 
        content.slice(0, lastRequireIndex) + 
        '\n' + responseHelpersImport + 
        content.slice(lastRequireIndex);
      modified = true;
    }
  }

  // Pattern 1: res.status(XXX).json({ success: false, message: '...' })
  // Replace with sendError(res, XXX, { message: '...' })
  const errorPattern1 = /res\.status\((\d+)\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*(?:,\s*error:\s*([^,}]+))?\s*}\s*\)/g;
  content = content.replace(errorPattern1, (match, statusCode, message, error) => {
    modified = true;
    if (error) {
      return `sendError(res, ${statusCode}, { message: '${message}', error: ${error.trim()} })`;
    }
    return `sendError(res, ${statusCode}, { message: '${message}' })`;
  });

  // Pattern 2: res.status(XXX).json({ success: false, message: '...', error: ... })
  const errorPattern2 = /res\.status\((\d+)\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*,\s*error:\s*([^}]+)\s*}\s*\)/g;
  content = content.replace(errorPattern2, (match, statusCode, message, error) => {
    modified = true;
    return `sendError(res, ${statusCode}, { message: '${message}', error: ${error.trim()} })`;
  });

  // Pattern 3: res.status(404).json({ success: false, message: '... not found' })
  // Replace with sendNotFound(res, 'Resource', 'id')
  const notFoundPattern = /res\.status\(404\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*}\s*\)/g;
  content = content.replace(notFoundPattern, (match, message) => {
    modified = true;
    // Try to extract resource name and identifier from message
    const resourceMatch = message.match(/(\w+)\s+not\s+found/i);
    if (resourceMatch) {
      return `sendNotFound(res, '${resourceMatch[1]}', '')`;
    }
    return `sendNotFound(res, 'Resource', '')`;
  });

  // Pattern 4: res.status(401).json({ success: false, message: '...' })
  // Replace with sendUnauthorized(res, '...')
  const unauthorizedPattern = /res\.status\(401\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*}\s*\)/g;
  content = content.replace(unauthorizedPattern, (match, message) => {
    modified = true;
    return `sendUnauthorized(res, '${message}')`;
  });

  // Pattern 5: res.status(400).json({ success: false, message: '...' }) - multiline
  // Replace with sendError(res, 400, { message: '...' })
  const badRequestPattern1 = /res\.status\(400\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*}\s*\)/g;
  content = content.replace(badRequestPattern1, (match, message) => {
    modified = true;
    return `sendError(res, 400, { message: '${message}' })`;
  });
  
  // Pattern 5b: Multiline res.status(400).json({ ... })
  const badRequestPattern2 = /res\.status\(400\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*,\s*}\s*\)/gs;
  content = content.replace(badRequestPattern2, (match, message) => {
    modified = true;
    return `sendError(res, 400, { message: '${message}' })`;
  });
  
  // Pattern 5c: return res.status(400).json({ success: false, message: '...' })
  const badRequestPattern3 = /return\s+res\.status\(400\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*,\s*}\s*\)/gs;
  content = content.replace(badRequestPattern3, (match, message) => {
    modified = true;
    return `return sendError(res, 400, { message: '${message}' })`;
  });

  // Pattern 6: res.status(500).json({ success: false, message: '...', error: ... })
  const serverErrorPattern = /res\.status\(500\)\.json\(\s*{\s*success:\s*false\s*,\s*message:\s*['"]([^'"]+)['"]\s*(?:,\s*error:\s*([^}]+))?\s*}\s*\)/g;
  content = content.replace(serverErrorPattern, (match, message, error) => {
    modified = true;
    if (error) {
      return `sendError(res, 500, { message: '${message}', error: ${error.trim()} })`;
    }
    return `sendError(res, 500, { message: '${message}' })`;
  });

  // Pattern 7: res.json({ success: true, message: '...', data: ... })
  // Replace with sendSuccess(res, 200, { message: '...', data: ... })
  const successPattern1 = /res\.json\(\s*{\s*success:\s*true\s*,\s*message:\s*['"]([^'"]+)['"]\s*,\s*data:\s*([^}]+)\s*}\s*\)/g;
  content = content.replace(successPattern1, (match, message, data) => {
    modified = true;
    return `sendSuccess(res, 200, { message: '${message}', data: ${data.trim()} })`;
  });

  // Pattern 8: res.status(XXX).json({ success: true, message: '...', data: ... })
  const successPattern2 = /res\.status\((\d+)\)\.json\(\s*{\s*success:\s*true\s*,\s*message:\s*['"]([^'"]+)['"]\s*,\s*data:\s*([^}]+)\s*}\s*\)/g;
  content = content.replace(successPattern2, (match, statusCode, message, data) => {
    modified = true;
    return `sendSuccess(res, ${statusCode}, { message: '${message}', data: ${data.trim()} })`;
  });

  if (modified) {
    // Backup original file
    const backupPath = filePath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, fs.readFileSync(filePath));
    
    // Write modified content
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated: ${fileName}`);
    return true;
  } else {
    console.log(`⏭️  Skipped: ${fileName} (no changes needed)`);
    return false;
  }
}

// Main execution
console.log('🔧 Starting API Response Standardization...\n');

const controllerFiles = fs.readdirSync(CONTROLLERS_DIR)
  .filter(file => file.endsWith('Controller.js'))
  .map(file => path.join(CONTROLLERS_DIR, file));

let updatedCount = 0;
for (const file of controllerFiles) {
  if (standardizeController(file)) {
    updatedCount++;
  }
}

console.log(`\n🎉 Migration completed!`);
console.log(`📊 Updated ${updatedCount} out of ${controllerFiles.length} controllers`);
console.log(`\n📋 Next steps:`);
console.log(`1. Review the updated files for any manual adjustments needed`);
console.log(`2. Test your API endpoints`);
console.log(`3. Remove .backup files once satisfied with changes`);
