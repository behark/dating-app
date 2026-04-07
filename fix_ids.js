const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'backend', '__tests__', 'routes');

const replacements = [
  { match: /['"]u1['"]/g, replace: "'507f191e810c19729de860e1'" },
  { match: /['"]u2['"]/g, replace: "'507f191e810c19729de860e2'" },
  { match: /['"]u3['"]/g, replace: "'507f191e810c19729de860e3'" },
  { match: /['"]m1['"]/g, replace: "'507f191e810c19729de860f1'" },
  { match: /['"]n1['"]/g, replace: "'507f191e810c19729de86001'" },
  { match: /['"]s1['"]/g, replace: "'507f191e810c19729de860a1'" },
  { match: /['"]c1['"]/g, replace: "'507f191e810c19729de860c1'" },
  { match: /['"]msg1['"]/g, replace: "'507f191e810c19729de860b1'" },
  { match: /['"]user_1['"]/g, replace: "'507f191e810c19729de860e1'" },
  { match: /['"]user_2['"]/g, replace: "'507f191e810c19729de860e2'" },
  
  // also within URLs like /api/profile/u2
  { match: /\/api\/profile\/u2/g, replace: "/api/profile/507f191e810c19729de860e2" },
  { match: /\/api\/notifications\/n1\/read/g, replace: "/api/notifications/507f191e810c19729de86001/read" },
  { match: /\/api\/swipes\/matches\/m1/g, replace: "/api/swipes/matches/507f191e810c19729de860f1" },
  { match: /\/api\/gamification\/levels\/u1/g, replace: "/api/gamification/levels/507f191e810c19729de860e1" },
  { match: /\/api\/chat\/c1\/messages/g, replace: "/api/chat/507f191e810c19729de860c1/messages" },
  { match: /\/api\/chat\/c1\/reactions\/msg1/g, replace: "/api/chat/507f191e810c19729de860c1/reactions/507f191e810c19729de860b1" },
  { match: /\/api\/media\/voice\/c1/g, replace: "/api/media/voice/507f191e810c19729de860c1" },
  { match: /\/api\/media\/video-call\/c1/g, replace: "/api/media/video-call/507f191e810c19729de860c1" }
];

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

// Also do middlewares and root directory of __tests__
const allTestDirs = [
  path.join(__dirname, 'backend', '__tests__', 'routes'),
  path.join(__dirname, 'backend', '__tests__', 'middleware'),
  path.join(__dirname, 'backend', '__tests__')
];

let files = [];
for (const dir of allTestDirs) {
  if (fs.existsSync(dir)) {
    const dirFiles = fs.readdirSync(dir);
    for (const f of dirFiles) {
      if (f.endsWith('.test.js')) {
        files.push(path.join(dir, f));
      } else if (fs.statSync(path.join(dir, f)).isDirectory() && dir === path.join(__dirname, 'backend', '__tests__', 'routes')) {
        // Only recurse into routes if it had subdirs, but we just manually loop them
      }
    }
  }
}

// deduplicate files
files = [...new Set(files)];

console.log(`Found ${files.length} test files to process.`);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  replacements.forEach(rep => {
    content = content.replace(rep.match, rep.replace);
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated IDs in ${file}`);
  }
});
