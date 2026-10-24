const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUTPUT_DIR = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\ef7dbeb9-400b-48ae-8e38-849583ae7ee0\\viewports';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const viewports = [
  { name: 'mobile_360', width: 360, height: 640, mobile: true },
  { name: 'mobile_390', width: 390, height: 844, mobile: true },
  { name: 'tablet_768', width: 768, height: 1024, mobile: false },
  { name: 'laptop_1024', width: 1024, height: 768, mobile: false },
  { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
];

async function captureViewports() {
  console.log('Launching Edge for responsive viewport capture...');
  const edge = spawn(EDGE_PATH, [
    '--remote-debugging-port=9223',
    '--headless=new',
    '--user-data-dir=C:\\Users\\ASUS\\AppData\\Local\\Temp\\edge-vp-profile',
    'http://localhost:3000'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9223/json', (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      const pageTarget = targets.find(t => t.type === 'page' && t.url.includes('localhost:3000')) || targets.find(t => t.type === 'page');
      if (pageTarget && pageTarget.webSocketDebuggerUrl) {
        wsUrl = pageTarget.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Edge CDP');
    edge.kill();
    return;
  }

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

  await send('Page.enable');
  await send('Runtime.enable');

  // Initial wait for React hydration & active material data
  console.log('Waiting for React hydration & data loading...');
  for (let i = 0; i < 30; i++) {
    const res = await send('Runtime.evaluate', {
      expression: `Boolean(document.querySelector('h3') && document.body.innerText.includes('ACTIVE MATERIAL'))`
    });
    if (res?.result?.value) {
      console.log('Active material rendered!');
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(OUTPUT_DIR, `${vp.name}.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    const stat = fs.statSync(screenshotPath);
    console.log(`- ${vp.name} (${vp.width}x${vp.height}): OK (${stat.size} bytes)`);
  }

  ws.close();
  edge.kill();
  console.log('All responsive viewport screenshots updated successfully!');
}

captureViewports().catch(err => {
  console.error('Viewport capture failed:', err);
  process.exit(1);
});
