const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dir = path.resolve('frontend/public/models');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const downloads = [
  {
    name: 'brain.glb',
    url: 'https://raw.githubusercontent.com/Rickaym/brain-game/main/public/models/brain.glb'
  },
  {
    name: 'heart.glb',
    url: 'https://raw.githubusercontent.com/hubmapconsortium/ccf-releases/b036a91aaf7234f462b1249d4a5f4fb0e982f412/v1.2/models/VH_F_Heart.glb'
  },
  {
    name: 'lungs.glb',
    url: 'https://cdn.jsdelivr.net/gh/organui/lungs-3d@5815084f43efe438ebfae3fd889ee2baf343dfbf/public/models/lungs.glb'
  }
];

downloads.forEach(d => {
  const dest = path.join(dir, d.name);
  console.log(`Downloading ${d.name}...`);
  execSync(`curl.exe -sL "${d.url}" -o "${dest}"`);
  const size = fs.statSync(dest).size;
  console.log(`Saved ${d.name}: ${(size / 1024 / 1024).toFixed(2)} MB`);
});
