const fs = require('fs');
const path = require('path');

// Read existing metadata
const metadataPath = path.join(__dirname, 'public/assets/stickers/bizarrebeasts/metadata.json');
const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));

// Get all sticker files
const stickerDir = path.join(__dirname, 'public/assets/stickers/bizarrebeasts');
const files = fs.readdirSync(stickerDir)
  .filter(f => f.startsWith('bizarrebeasts-stickers-') && f.endsWith('.svg'))
  .map(f => {
    const match = f.match(/bizarrebeasts-stickers-(\d+)\.svg/);
    return match ? { filename: f, number: parseInt(match[1]) } : null;
  })
  .filter(Boolean)
  .sort((a, b) => a.number - b.number);

console.log(`Found ${files.length} sticker files`);

// Create a map of existing stickers by filename (preserve their tiers)
const existingStickers = {};
metadata.stickers.forEach(s => {
  existingStickers[s.filename] = s;
});

// Identify which files are NEW (not in existing metadata)
const newFiles = files.filter(({ filename }) => !existingStickers[filename]);
console.log(`Found ${newFiles.length} NEW sticker files:`, newFiles.map(f => f.filename));

// Create stickers array with all files
const allStickers = files.map(({ filename, number }) => {
  if (existingStickers[filename]) {
    // Keep existing sticker WITH its original tier
    return existingStickers[filename];
  } else {
    // Create new sticker entry for missing ones - set to 'basic' (open to all)
    let category = 'characters';
    if (number >= 10 && number <= 15) category = 'bubbles';
    else if (number >= 16 && number <= 25) category = 'items';
    else if (number >= 26 && number <= 35) category = 'banners';
    else if (number >= 90) category = 'special';

    return {
      id: `beast-${number}`,
      name: `Beast Sticker ${number}`,
      filename: filename,
      category: category,
      tags: [
        'beast',
        'sticker',
        'new'
      ],
      tier: 'basic'  // NEW stickers are open to everyone
    };
  }
});

// Shuffle the array for variety (Fisher-Yates shuffle)
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Shuffle stickers for variety
const shuffledStickers = shuffle(allStickers);

// Update metadata with shuffled stickers
metadata.stickers = shuffledStickers;

// Write updated metadata
fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

console.log(`Updated metadata with ${metadata.stickers.length} stickers`);
console.log('- Existing stickers: kept their original tier requirements');
console.log(`- New stickers (${newFiles.length}): set to basic tier (open to all)`);

// Show tier distribution
const tierCounts = {};
metadata.stickers.forEach(s => {
  tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
});
console.log('Tier distribution:', tierCounts);