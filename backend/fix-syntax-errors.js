#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'controllers/premiumController.js',
  'controllers/privacyController.js',
  'controllers/safetyController.js',
  'controllers/socialMediaController.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern: await SomeModel.method(
  //    if (!var) { ... }
  //    actualArguments
  // )
  
  // Fix pattern: Move the if check after the closing parenthesis
  const regex = /(const|let)\s+(\w+)\s*=\s*await\s+\w+\.\w+\([^)]*\n\s*if\s*\(!(\w+)\)\s*{[^}]*}\s*\n([^)]*)\)/g;
  
  let match;
  let newContent = content;
  
  // Find all misplaced checks
  const replacements = [];
  while ((match = regex.exec(content)) !== null) {
    const fullMatch = match[0];
    const varType = match[1];
    const varName = match[2];
    const checkVar = match[3];
    const remainingArgs = match[4];
    
    if (varName === checkVar) {
      // This is a misplaced null check
      console.log(`Found misplaced null check for '${varName}' in ${file}`);
      
      // Extract the null check
      const nullCheckMatch = fullMatch.match(/if\s*\(!(\w+)\)\s*{([^}]*)}/s);
      if (nullCheckMatch) {
        const nullCheckBlock = nullCheckMatch[0];
        
        // Remove the null check from the middle
        const fixed = fullMatch.replace(/\n\s*if\s*\(!(\w+)\)\s*{[^}]*}\s*\n/, '\n');
        
        replacements.push({
          original: fullMatch,
          fixed: fixed,
          nullCheck: nullCheckBlock
        });
      }
    }
  }
  
  if (replacements.length > 0) {
    // Apply replacements
    replacements.forEach(r => {
      newContent = newContent.replace(r.original, r.fixed + '\n    ' + r.nullCheck);
    });
    
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✓ Fixed ${replacements.length} syntax errors in ${file}\n`);
  }
});

console.log('Done!');
