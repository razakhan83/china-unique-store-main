const fs = require('fs');
const path = require('path');

const ADMIN_DIR = path.join(__dirname, 'src/app/admin');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(ADMIN_DIR);
let modifiedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(/\brounded-2xl\b/g, 'rounded-md');
  content = content.replace(/\brounded-xl\b/g, 'rounded-md');
  content = content.replace(/rounded-\[1\.2rem\]/g, 'rounded-md');
  content = content.replace(/rounded-\[0\.5rem\]/g, 'rounded-md');
  
  content = content.replace(/\bshadow-xl\b/g, '');
  content = content.replace(/\bshadow-lg\b/g, '');
  content = content.replace(/\bshadow-md\b/g, '');
  content = content.replace(/\bshadow-sm\b/g, '');
  content = content.replace(/shadow-\[.*?\]/g, '');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nTotal files modified: ${modifiedCount}`);
