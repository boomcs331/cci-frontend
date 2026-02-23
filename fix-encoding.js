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
  "src/app/(admin)/master-data/product-locations/page.tsx",
  "src/app/(admin)/master-data/product-types/page.tsx",
  "src/app/(admin)/master-data/suppliers/page.tsx",
  "src/app/(admin)/master-data/units/page.tsx"
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the Thai text in Suspense fallback
  content = content.replace(
    /<Suspense fallback=\{<div className="text-center py-8">[^<]*<\/div>\}>/g,
    '<Suspense fallback={<div className="text-center py-8">กำลังโหลด...</div>}>'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed encoding: ${file}`);
});

console.log('\nAll files fixed!');
