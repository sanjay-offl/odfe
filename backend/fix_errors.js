const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'src/controllers');
const files = fs.readdirSync(controllersDir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    let content = fs.readFileSync(path.join(controllersDir, file), 'utf-8');
    
    // Replace where: { ..., deletedAt: null } with where: { ... }
    content = content.replace(/,\s*deletedAt:\s*null/g, '');
    content = content.replace(/deletedAt:\s*null\s*,?/g, '');
    
    // Replace update({ where: { id }, data: { deletedAt: new Date() } }) with delete({ where: { id } })
    content = content.replace(/\.update\(\s*{\s*where\s*:\s*{\s*id\s*}\s*,\s*data\s*:\s*{\s*deletedAt\s*:\s*new Date\(\)\s*}\s*,?\s*}\s*\)/g, '.delete({ where: { id } })');
    
    // Replace generic data: { deletedAt: new Date() } in update
    content = content.replace(/data\s*:\s*{\s*deletedAt\s*:\s*new Date\(\)\s*}/g, '/* DELETE INSTEAD */');

    fs.writeFileSync(path.join(controllersDir, file), content);
  }
}
