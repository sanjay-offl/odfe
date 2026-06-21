const fs = require('fs');
const path = require('path');

function searchFiles(dir, keyword) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.next' || file === '.git') continue;
      const fullPath = path.join(dir, file);
      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          searchFiles(fullPath, keyword);
        } else if (stat.isFile()) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes(keyword) && fullPath.includes('.env')) {
            console.log(`Found in: ${fullPath}`);
            const lines = content.split('\n');
            lines.forEach(line => {
              if (line.includes('DATABASE_URL')) {
                console.log(line);
              }
            });
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

console.log("Searching...");
searchFiles('/home/sanjay/THADAM', 'fapedpvjzfiudlaujgai');
searchFiles('/home/sanjay/odfe', 'fapedpvjzfiudlaujgai');
console.log("Done.");
