const fs = require('fs');
const path = require('path');

// Directory containing the stickers
const stickerDir = path.join(__dirname, 'public/assets/stickers/bizarrebeasts');

// Process stickers 56-102
const startNum = 56;
const endNum = 102;

console.log('Starting to process stickers to remove white backgrounds...\n');

let processedCount = 0;
let skippedCount = 0;

for (let i = startNum; i <= endNum; i++) {
  const filename = `bizarrebeasts-stickers-${i}.svg`;
  const filepath = path.join(stickerDir, filename);

  // Check if file exists
  if (!fs.existsSync(filepath)) {
    console.log(`⚠️  File not found: ${filename}`);
    skippedCount++;
    continue;
  }

  // Read the SVG content
  let svgContent = fs.readFileSync(filepath, 'utf8');
  const originalContent = svgContent;

  // Remove white background rectangles
  // Pattern 1: rect with white fill at the beginning
  svgContent = svgContent.replace(
    /<rect[^>]*fill="#(?:fff|ffffff|FFF|FFFFFF|white)"[^>]*\/>/gi,
    ''
  );

  // Pattern 2: rect with white fill (different attribute order)
  svgContent = svgContent.replace(
    /<rect[^>]*style="[^"]*fill:\s*#(?:fff|ffffff|FFF|FFFFFF|white)[^"]*"[^>]*\/>/gi,
    ''
  );

  // Pattern 3: Simple white rect elements
  svgContent = svgContent.replace(
    /<rect\s+width="[^"]*"\s+height="[^"]*"\s+fill="#(?:fff|ffffff|FFF|FFFFFF|white)"\s*\/>/gi,
    ''
  );

  // Pattern 4: rect with x="0" y="0" and white fill
  svgContent = svgContent.replace(
    /<rect\s+x="0"\s+y="0"[^>]*fill="#(?:fff|ffffff|FFF|FFFFFF|white)"[^>]*\/>/gi,
    ''
  );

  // Check if any changes were made
  if (svgContent !== originalContent) {
    // Write the modified SVG back
    fs.writeFileSync(filepath, svgContent);
    console.log(`✅ Processed: ${filename} - white background removed`);
    processedCount++;
  } else {
    console.log(`⏭️  Skipped: ${filename} - no white background found`);
    skippedCount++;
  }
}

console.log('\n========================================');
console.log(`✨ Processing complete!`);
console.log(`   Processed: ${processedCount} files`);
console.log(`   Skipped: ${skippedCount} files`);
console.log('========================================');

// Quick verification - check one of the processed files
if (processedCount > 0) {
  const sampleFile = path.join(stickerDir, 'bizarrebeasts-stickers-100.svg');
  if (fs.existsSync(sampleFile)) {
    const content = fs.readFileSync(sampleFile, 'utf8');
    const hasWhiteRect = /<rect[^>]*fill="#(?:fff|ffffff|white)"[^>]*\/>/i.test(content);
    console.log(`\n🔍 Verification: Sticker 100 has white rect: ${hasWhiteRect ? 'YES ⚠️' : 'NO ✅'}`);
  }
}