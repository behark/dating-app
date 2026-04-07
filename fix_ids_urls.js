const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const dirFile = path.join(dir, file);
    const dirent = fs.statSync(dirFile);
    if (dirent.isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.test.js')) {
        filelist.push(dirFile);
      }
    }
  }
  return filelist;
};

const allTestDirs = [
  path.join(__dirname, 'backend', '__tests__')
];

let files = [];
for (const dir of allTestDirs) {
  if (fs.existsSync(dir)) {
    files = walkSync(dir, files);
  }
}

// deduplicate files
files = [...new Set(files)];

console.log(`Found ${files.length} test files to process.`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace in URLs
  content = content.replace(/\/u[1-9]/g, match => {
    return '/507f191e810c19729de860e' + match.charAt(2);
  });
  
  content = content.replace(/\/user_[1-9]/g, match => {
    return '/507f191e810c19729de860e' + match.charAt(6);
  });
  
  content = content.replace(/\/m[1-9]/g, match => {
    return '/507f191e810c19729de860f' + match.charAt(2);
  });
  
  content = content.replace(/\/c[1-9]/g, match => {
    return '/507f191e810c19729de860c' + match.charAt(2);
  });

  content = content.replace(/\/n[1-9]/g, match => {
    return '/507f191e810c19729de8600' + match.charAt(2);
  });

  // Replace missing strings that have no quotes in the previous replace
  content = content.replace(/userId:\s*['"]u([1-9])['"]/g, "userId: '507f191e810c19729de860e$1'");
  content = content.replace(/reportedUserId:\s*['"]u([1-9])['"]/g, "reportedUserId: '507f191e810c19729de860e$1'");
  content = content.replace(/blockedUserId:\s*['"]u([1-9])['"]/g, "blockedUserId: '507f191e810c19729de860e$1'");
  
  content = content.replace(/_id:\s*['"]user_([1-9])['"]/g, "_id: '507f191e810c19729de860e$1'");
  content = content.replace(/id:\s*['"]user_([1-9])['"]/g, "id: '507f191e810c19729de860e$1'");

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated URLs in ${file}`);
  }
});
