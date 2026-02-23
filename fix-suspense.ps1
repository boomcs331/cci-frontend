$files = @(
    "src\app\(admin)\master-data\customers\page.tsx",
    "src\app\(admin)\master-data\delivery-types\page.tsx",
    "src\app\(admin)\master-data\loading-points\page.tsx",
    "src\app\(admin)\master-data\locations\page.tsx",
    "src\app\(admin)\master-data\material-types\page.tsx",
    "src\app\(admin)\master-data\models\page.tsx",
    "src\app\(admin)\master-data\process-lines\page.tsx",
    "src\app\(admin)\master-data\product-delivery-types\page.tsx",
    "src\app\(admin)\master-data\product-locations\page.tsx",
    "src\app\(admin)\master-data\product-models\page.tsx",
    "src\app\(admin)\master-data\product-process-lines\page.tsx",
    "src\app\(admin)\master-data\product-types\page.tsx",
    "src\app\(admin)\master-data\product-units\page.tsx",
    "src\app\(admin)\master-data\suppliers\page.tsx",
    "src\app\(admin)\master-data\units\page.tsx"
)

foreach ($file in $files) {
    $content = Get-Content $file -Raw -Encoding UTF8
    
    # Add Suspense import
    $content = $content -replace 'import React, \{ useEffect, useState \} from "react";', 'import React, { useEffect, useState, Suspense } from "react";'
    
    # Rename default export to PageContent
    $content = $content -replace 'export default function Page\(\) \{', 'function PageContent() {'
    
    # Add new default export with Suspense at the end
    $content = $content -replace '(\}\s*)$', "`}`n`nexport default function Page() {`n  return (`n    <Suspense fallback={<div className=`"text-center py-8`">กำลังโหลด...</div>}>`n      <PageContent />`n    </Suspense>`n  );`n}`n"
    
    Set-Content $file -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Fixed: $file"
}

Write-Host "`nAll files fixed!"
