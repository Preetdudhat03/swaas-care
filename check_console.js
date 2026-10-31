const { spawn } = require('child_process');
const http = require('http');

console.log('Launching Chrome with remote debugging...');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  'https://swaascare-frontend.onrender.com/'
]);

setTimeout(async () => {
  try {
    const listRes = await new Promise((res, rej) => {
      http.get('http://127.0.0.1:9222/json', (r) => {
        let data = '';
        r.on('data', c => data += c);
        r.on('end', () => res(JSON.parse(data)));
      }).on('error', rej);
    });

    const page = listRes.find(p => p.type === 'page');
    console.log('Found page:', page ? page.url : 'none');

    if (page && page.webSocketDebuggerUrl) {
      const WebSocket = require('ws');
      const ws = new WebSocket(page.webSocketDebuggerUrl);

      ws.on('open', () => {
        console.log('Connected to Chrome DevTools WebSocket');
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      });

      ws.on('message', (msg) => {
        const parsed = JSON.parse(msg);
        if (parsed.method === 'Runtime.exceptionThrown') {
          console.error('\n>>> EXCEPTION THROWN:', JSON.stringify(parsed.params.exceptionDetails, null, 2));
        } else if (parsed.method === 'Runtime.consoleAPICalled') {
          console.log('[CONSOLE]', parsed.params.type, parsed.params.args.map(a => a.value || a.description).join(' '));
        }
      });

      setTimeout(() => {
        chromeProc.kill();
        process.exit(0);
      }, 7000);
    }
  } catch (err) {
    console.error('Error connecting to devtools:', err.message);
    chromeProc.kill();
    process.exit(1);
  }
}, 2500);
