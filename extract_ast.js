const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');

const file = 'src/app/admin/orders/AdminOrdersClient.jsx';
const code = fs.readFileSync(file, 'utf8');

const ast = parser.parse(code, {
  sourceType: 'module',
  plugins: ['jsx']
});

let filtersJsxPath = null;
let tableJsxPath = null;
let componentScope = null;

traverse(ast, {
  JSXElement(path) {
    if (path.node.openingElement.name.name === 'div') {
      const classAttr = path.node.openingElement.attributes.find(
        attr => attr.name && attr.name.name === 'className' && 
                attr.value && attr.value.value && 
                attr.value.value.includes('admin-filter-shell')
      );
      if (classAttr && !filtersJsxPath) {
        // This is actually inside a conditional {selectedOrders.length > 0 ? (div) : (div)}
        // We want to capture the entire conditional!
        if (path.parentPath.isConditionalExpression()) {
           filtersJsxPath = path.parentPath;
        }
      }
    }
  },
  FunctionDeclaration(path) {
    if (path.node.id && path.node.id.name === 'AdminOrdersClient') {
      componentScope = path.scope;
      
      // Look for table
      path.traverse({
        JSXElement(p) {
          // Look for Desktop Table div
          if (p.node.openingElement.name.name === 'div') {
            const cls = p.node.openingElement.attributes.find(a => a.name && a.name.name === 'className');
            if (cls && cls.value && cls.value.value && cls.value.value.includes('hidden overflow-hidden rounded-xl border border-border bg-card md:block shadow-xs')) {
              // Wait, it is inside a conditional {isPending ? <Skeleton/> : <div>}
              if (p.parentPath.isConditionalExpression()) {
                 tableJsxPath = p.parentPath;
              }
            }
          }
        }
      });
    }
  }
});

function extractVars(jsxPath) {
  const vars = new Set();
  jsxPath.traverse({
    Identifier(path) {
      // Check if this identifier is a reference to a variable declared in the component scope
      if (path.isReferencedIdentifier()) {
        const binding = path.scope.getBinding(path.node.name);
        if (binding && componentScope.bindings[path.node.name]) {
          vars.add(path.node.name);
        }
        // Also add destructured/params from componentScope that are accessed
        if (!binding && componentScope.hasBinding(path.node.name)) {
          vars.add(path.node.name);
        }
      }
    }
  });
  return Array.from(vars);
}

const filterVars = extractVars(filtersJsxPath);
const tableVars = extractVars(tableJsxPath);

console.log('Filter props:', filterVars.join(', '));
console.log('Table props:', tableVars.join(', '));

// Generate the new components
const makeComponent = (name, props, jsxAst) => {
  return `import React from 'react';\n// TODO: Add missing imports\n\nexport function ${name}({ ${props.join(', ')} }) {\n  return (\n    ${generate(jsxAst.node).code}\n  );\n}\n`;
};

fs.writeFileSync('src/components/admin/orders/OrderFilters.jsx', makeComponent('OrderFilters', filterVars, filtersJsxPath));
fs.writeFileSync('src/components/admin/orders/OrderTable.jsx', makeComponent('OrderTable', tableVars, tableJsxPath));

// Replace in AdminOrdersClient
const filtersPropString = filterVars.map(v => `${v}={${v}}`).join(' ');
const tablePropString = tableVars.map(v => `${v}={${v}}`).join(' ');

filtersJsxPath.replaceWithSourceString(`<OrderFilters ${filtersPropString} />`);
tableJsxPath.replaceWithSourceString(`<OrderTable ${tablePropString} />`);

// Add imports
const newCode = generate(ast).code;
const finalCode = `import { OrderFilters } from '@/components/admin/orders/OrderFilters';\nimport { OrderTable } from '@/components/admin/orders/OrderTable';\n` + newCode;

fs.writeFileSync('src/app/admin/orders/AdminOrdersClient.jsx', finalCode);
console.log('Done!');
