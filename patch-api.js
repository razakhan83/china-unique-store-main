const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('route.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src/app/api/admin');
let changed = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // We find 'if (!session' or similar, followed by a block ending with '}'
  // We only replace inside POST, PUT, DELETE functions.
  
  const blocks = content.split('export async function ');
  let newContent = blocks[0];
  
  for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i];
    if (block.startsWith('POST') || block.startsWith('PUT') || block.startsWith('DELETE')) {
      if (!block.includes('isDemo')) {
         // Find the first if (!session...isAdmin) { ... }
         // We can just find 'status: 401' and the next '}'
         const adminCheckRegex = /(if\s*\([^)]*isAdmin[^)]*\)\s*\{[\s\S]*?status:\s*401\s*\}\s*\)\s*;?\s*\})/;
         block = block.replace(adminCheckRegex, (match) => {
           return match + `\n    if (session?.user?.isDemo) {\n      return NextResponse.json({ success: false, message: 'Demo Mode: Actions are disabled. You have read-only access.', error: 'Demo Mode: Actions are disabled. You have read-only access.' }, { status: 403 });\n    }`;
         });
      }
    }
    newContent += 'export async function ' + block;
  }

  if (newContent !== originalContent) {
    fs.writeFileSync(file, newContent);
    changed++;
    console.log('Patched:', file);
  }
}
console.log('Total files patched:', changed);
