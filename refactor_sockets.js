const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, 'backend', 'server.js');
const serverCode = fs.readFileSync(serverFile, 'utf8');

const lines = serverCode.split('\n');

// Find start and end
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const io = new Server(server, {') && lines[i-1].includes('const server = createServer(app);')) {
    startIndex = i;
  }
}

// Search for the end of socket events: socket.on('error' ... }); }); ... // Start server (for local development)
if (startIndex !== -1) {
  for (let i = startIndex; i < lines.length; i++) {
    if (lines[i].includes('// Start server (for local development)')) {
      endIndex = i;
      // Step back past empty lines
      while (lines[endIndex - 1].trim() === '') {
        endIndex--;
      }
      break;
    }
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  console.log(`Replacing lines ${startIndex} to ${endIndex}`);
  const before = lines.slice(0, startIndex);
  const after = lines.slice(endIndex);
  
  // also delete `sanitizeHtml` function and `connectedUsers` map from before, if they were located there
  // let's just find `// HTML entity escaping to prevent stored XSS in chat messages` and remove it
  let htmlStart = -1;
  let htmlEnd = -1;
  for (let i = 0; i < before.length; i++) {
    if (before[i].includes('// HTML entity escaping to prevent stored XSS')) {
      htmlStart = i;
    }
    if (htmlStart !== -1 && before[i] === '}') {
      htmlEnd = i;
      break;
    }
  }
  
  if (htmlStart !== -1 && htmlEnd !== -1) {
    before.splice(htmlStart, htmlEnd - htmlStart + 1);
  }

  const newCode = [
    ...before,
    "const { initializeSocket } = require('./src/config/sockets');",
    "const io = initializeSocket(server, isOriginAllowed);",
    ...after
  ].join('\n');
  
  fs.writeFileSync(serverFile, newCode, 'utf8');
  console.log('Successfully refactored Socket.io logic from server.js');
} else {
  console.log('Failed to find start/end bounds for Socket logic.');
}
