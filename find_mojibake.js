const fs = require('fs');
const path = require('path');

function scan(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules' && f !== '.next') scan(full);
    } else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const buf = fs.readFileSync(full);
      const str = buf.toString('utf8');
      const lines = str.split('\n');
      lines.forEach((l, i) => {
        // check for suspicious character sequences
        if (l.includes('\u2261') || l.includes('\u0393') || l.includes('\u03c0') || l.includes('Alert Doctor') || l.includes('Day Streak') || l.includes('Welcome to SwaasCare') || l.includes('Voice Tremor') || l.includes('Analyzing Voice Biomarkers')) {
          console.log(full + ':' + (i + 1) + ' ' + l.trim());
        }
      });
    }
  }
}
scan('frontend/src');
