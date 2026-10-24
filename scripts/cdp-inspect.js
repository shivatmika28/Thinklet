const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');

async function inspectBrowser() {
  console.log('Launching Edge with remote debugging...');
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--remote-debugging-port=9222',
    '--headless=new',
    '--user-data-dir=C:\\Users\\ASUS\\AppData\\Local\\Temp\\edge-debug-profile',
    'http://localhost:3000'
  ]);

  // Wait for remote debugging to be ready
  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9222/json', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      console.log('Available targets:', targets.map(t => ({ type: t.type, url: t.url })));
      const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000')) || targets.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {
      // retry
    }
  }

  if (!wsUrl) {
    console.error('Could not connect to Edge DevTools');
    edge.kill();
    return;
  }

  console.log('Connected to DevTools via WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  await new Promise(r => ws.on('open', r));

  let reqId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = reqId++;
      const handler = (data) => {
        const msg = JSON.parse(data);
        if (msg.id === id) {
          ws.off('message', handler);
          resolve(msg.result);
        }
      };
      ws.on('message', handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Console and Runtime
  await send('Console.enable');
  await send('Runtime.enable');
  await send('Page.enable');

  const logs = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data);
    if (msg.method === 'Console.messageAdded') {
      logs.push(`[CONSOLE ${msg.params.message.level}] ${msg.params.message.text}`);
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[CONSOLE ${msg.params.type}] ` + msg.params.args.map(a => a.value || JSON.stringify(a)).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      logs.push(`[EXCEPTION] ` + JSON.stringify(msg.params.exceptionDetails));
    }
  });

  // Wait 4 seconds for full hydration and network requests
  console.log('Waiting 4s for page hydration...');
  await new Promise(r => setTimeout(r, 4000));

  console.log('\n--- BROWSER CONSOLE LOGS & EXCEPTIONS ---');
  // Set viewport to desktop 1440x900
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Evaluate exact computed styles of main and sidebar
  console.log('\n--- EVALUATING EXACT COMPUTED STYLES AT 1440x900 ---');
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const sidebar = document.querySelector('.hidden.md\\\\:block');
      const main = document.querySelector('main');
      const csMain = window.getComputedStyle(main);
      const csSidebar = window.getComputedStyle(sidebar);

      return {
        sidebar: {
          display: csSidebar.display,
          width: csSidebar.width,
          height: csSidebar.height,
          rect: sidebar.getBoundingClientRect()
        },
        main: {
          display: csMain.display,
          flexDirection: csMain.flexDirection,
          width: csMain.width,
          height: csMain.height,
          overflowY: csMain.overflowY,
          rect: main.getBoundingClientRect(),
          cardsCount: main.querySelectorAll('.animate-card-entrance').length,
          buttonsCount: main.querySelectorAll('button, a').length
        }
      };
    })()`,
    returnByValue: true
  });

  console.log('Exact Layout Metrics:', JSON.stringify(evalResult.result.value, null, 2));

  console.log('evalResult:', JSON.stringify(evalResult, null, 2));

  // Take screenshot via CDP
  const fs = require('fs');
  const screenshot = await send('Page.captureScreenshot', { format: 'png' });
  if (screenshot && screenshot.data) {
    fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\ef7dbeb9-400b-48ae-8e38-849583ae7ee0\\browser_cdp.png', Buffer.from(screenshot.data, 'base64'));
    console.log('Screenshot saved to browser_cdp.png');
  }

  ws.close();
  edge.kill();
}

inspectBrowser().catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
