const { spawn } = require('child_process');
const http = require('http');

console.log('Starting next server...');
const nextProc = spawn('npx', ['next', 'start', '-p', '3005'], { cwd: 'frontend', shell: true });

nextProc.stdout.on('data', d => console.log('[NEXT]:', d.toString().trim()));
nextProc.stderr.on('data', d => console.error('[NEXT ERR]:', d.toString().trim()));

setTimeout(() => {
  console.log('Launching headless chrome to inspect console logs...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const chromeProc = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--enable-logging=stderr',
    '--v=1',
    'http://localhost:3005/'
  ]);

  let logs = '';
  chromeProc.stderr.on('data', d => {
    logs += d.toString();
  });
  chromeProc.stdout.on('data', d => {
    logs += d.toString();
  });

  setTimeout(() => {
    console.log('=== CHROME LOGS ===');
    console.log(logs);
    chromeProc.kill();
    nextProc.kill();
    process.exit(0);
  }, 6000);
}, 4000);
