const fs = require('fs');
const path = require('path');

const files = [
  "src/app/(admin)/master-data/customers/page.tsx",
  "src/app/(admin)/master-data/delivery-types/page.tsx",
  "src/app/(admin)/master-data/loading-points/page.tsx",
  "src/app/(admin)/master-data/locations/page.tsx",
  "src/app/(admin)/master-data/material-types/page.tsx",
  "src/app/(admin)/master-data/models/page.tsx",
  "src/app/(admin)/master-data/process-lines/page.tsx",
  "src/app/(admin)/master-data/product-delivery-types/page.tsx",
  "src/app/(admin)/master-data/product-locations/page.tsx",
  "src/app/(admin)/master-data/product-process-lines/page.tsx",
  "src/app/(admin)/master-data/product-types/page.tsx",
  "src/app/(admin)/master-data/product-units/page.tsx",
  "src/app/(admin)/master-data/suppliers/page.tsx",
  "src/app/(admin)/master-data/units/page.tsx"
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Skip if already fixed properly
  if (content.includes('function PageContent()') && !content.match(/export default function Page\(\) \{[\s\S]*?export default function Page\(\)/)) {
    console.log(`Skipped (already fixed): ${file}`);
    return;
  }
  
  // Remove the duplicate export default if exists
  const lines = content.split('\n');
  const filtered = [];
  let skipNext = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export default function Page()')) {
      // Check if this is the new wrapper (has Suspense after it)
      if (i + 1 < lines.length && lines[i + 1].includes('return')) {
        const nextFewLines = lines.slice(i, Math.min(i + 5, lines.length)).join('\n');
        if (nextFewLines.includes('Suspense')) {
          // This is the new wrapper, keep it
          filtered.push(lines[i]);
        } else {
          // This is duplicate, skip it and next few lines until closing brace
          let braceCount = 0;
          let started = false;
          for (let j = i; j < lines.length; j++) {
            if (lines[j].includes('{')) {
              braceCount++;
              started = true;
            }
            if (lines[j].includes('}')) {
              braceCount--;
            }
            if (started && braceCount === 0) {
              i = j; // Skip to this line
              break;
            }
          }
        }
      } else {
        filtered.push(lines[i]);
      }
    } else {
      filtered.push(lines[i]);
    }
  }
  
  content = filtered.join('\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed: ${file}`);
});

console.log('\nAll files fixed!');
