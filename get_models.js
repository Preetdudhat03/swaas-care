const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const targetDir = path.resolve('frontend/public/models');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

console.log('Downloading @broberg/bodymap tarball...');
const tarballUrl = execSync('npm view @broberg/bodymap dist.tarball', { encoding: 'utf8' }).trim();
console.log('Tarball URL:', tarballUrl);

execSync(`curl.exe -sL "${tarballUrl}" -o bodymap.tgz`);
execSync(`tar -xzf bodymap.tgz package/models/body-female.glb package/models/body-male.glb`);

fs.copyFileSync('package/models/body-female.glb', path.join(targetDir, 'body-female.glb'));
fs.copyFileSync('package/models/body-male.glb', path.join(targetDir, 'body-male.glb'));

// Cleanup
fs.unlinkSync('bodymap.tgz');
fs.rmSync('package', { recursive: true, force: true });

console.log('Successfully copied models:');
console.log('body-female.glb:', fs.statSync(path.join(targetDir, 'body-female.glb')).size, 'bytes');
console.log('body-male.glb:', fs.statSync(path.join(targetDir, 'body-male.glb')).size, 'bytes');
