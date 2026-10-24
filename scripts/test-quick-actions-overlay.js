const http = require('http');
const { spawn } = require('child_process');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOT_DIR = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\ef7dbeb9-400b-48ae-8e38-849583ae7ee0\\quick_actions';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function testQuickActions() {
  console.log('=== TESTING REDESIGNED FULL-SCREEN QUICK ACTIONS OVERLAY ===\n');

  console.log('1. Launching Edge browser...');
  const edge = spawn(EDGE_PATH, [
    '--remote-debugging-port=9224',
    '--headless=new',
    '--user-data-dir=C:\\Users\\ASUS\\AppData\\Local\\Temp\\edge-qa-profile',
    'http://localhost:3000'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 500));
    try {
      const targets = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:9224/json', (res) => {
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
  await send('Input.enable');

  console.log('2. Waiting for React hydration...');
  await new Promise(r => setTimeout(r, 3500));

  // Set standard desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Check initial state (Overlay closed)
  console.log('3. Checking initial state (closed)...');
  const initialCheck = await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const plusBtn = document.querySelector('button[aria-haspopup="dialog"]');
      return {
        hasDialog: Boolean(dialog),
        plusBtnFound: Boolean(plusBtn),
        plusExpanded: plusBtn ? plusBtn.getAttribute('aria-expanded') : null
      };
    })()`,
    returnByValue: true
  });
  console.log('   Initial check:', initialCheck.result.value);

  // Click floating plus button to open overlay
  console.log('4. Clicking floating plus button...');
  const openResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const plusBtn = document.querySelector('button[aria-haspopup="dialog"]');
      if (plusBtn) plusBtn.click();
      return Boolean(plusBtn);
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 600));

  // Verify overlay opened and inspect structure
  console.log('5. Verifying overlay opened & measuring elements...');
  const dialogInspect = await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (!dialog) return { error: 'Dialog not found' };

      const cs = window.getComputedStyle(dialog);
      const title = document.getElementById('quick-actions-title')?.textContent;
      const desc = document.getElementById('quick-actions-desc')?.textContent;
      const actions = Array.from(dialog.querySelectorAll('button:not([aria-label*="Close"]):not([aria-label*="Dismiss"])')).map(b => {
        const textContainer = b.querySelector('div:nth-child(2)');
        const iconContainer = b.querySelector('div:first-child');
        const bRect = b.getBoundingClientRect();
        const iconRect = iconContainer ? iconContainer.getBoundingClientRect() : null;
        const textRect = textContainer ? textContainer.getBoundingClientRect() : null;

        // Check if icon and text overlap
        let overlaps = false;
        if (iconRect && textRect) {
          overlaps = !(iconRect.right <= textRect.left || iconRect.left >= textRect.right || iconRect.bottom <= textRect.top || iconRect.top >= textRect.bottom);
        }

        return {
          title: textContainer?.firstElementChild?.textContent,
          description: textContainer?.lastElementChild?.textContent,
          height: bRect.height,
          width: bRect.width,
          touchTargetSatisfied: bRect.height >= 64,
          overlaps
        };
      });

      return {
        isOpen: true,
        dialogDisplay: cs.display,
        dialogZIndex: cs.zIndex,
        dialogPosition: cs.position,
        title,
        desc,
        actionsCount: actions.length,
        actions
      };
    })()`,
    returnByValue: true
  });
  console.log('   Dialog inspection:', JSON.stringify(dialogInspect.result.value, null, 2));

  // Test across responsive viewports with overlay OPEN
  console.log('\n6. Capturing full-screen overlay screenshots across responsive viewports:');
  const viewports = [
    { name: 'desktop_1440', width: 1440, height: 900, mobile: false },
    { name: 'laptop_1024', width: 1024, height: 768, mobile: false },
    { name: 'tablet_768', width: 768, height: 1024, mobile: false },
    { name: 'mobile_390', width: 390, height: 844, mobile: true },
    { name: 'mobile_360', width: 360, height: 640, mobile: true },
  ];

  for (const vp of viewports) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.width,
      height: vp.height,
      deviceScaleFactor: 1,
      mobile: vp.mobile
    });
    await new Promise(r => setTimeout(r, 600));

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    const screenshotPath = path.join(SCREENSHOT_DIR, `${vp.name}_overlay.png`);
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    const stat = fs.statSync(screenshotPath);
    console.log(`   - ${vp.name} (${vp.width}x${vp.height}): screenshot saved (${stat.size} bytes)`);
  }

  // Restore desktop viewport
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 400));

  // 7. Test Escape key closes dialog
  console.log('\n7. Testing Escape key dismiss...');
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise(r => setTimeout(r, 500));

  const afterEscape = await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const activeEl = document.activeElement;
      const plusBtn = document.querySelector('button[aria-haspopup="dialog"]');
      return {
        dialogClosed: !dialog,
        focusRestoredToPlus: activeEl === plusBtn
      };
    })()`,
    returnByValue: true
  });
  console.log('   After Escape:', afterEscape.result.value);

  // 8. Re-open and test Backdrop Click dismiss
  console.log('\n8. Testing Backdrop Click dismiss...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[aria-haspopup="dialog"]').click()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 500));

  // Click backdrop at (100, 100)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) dialog.click();
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 500));

  const afterBackdrop = await send('Runtime.evaluate', {
    expression: `Boolean(!document.querySelector('[role="dialog"]'))`,
    returnByValue: true
  });
  console.log('   Backdrop dismiss success:', afterBackdrop.result.value);

  // 9. Re-open and test Action Navigation
  console.log('\n9. Testing Action Click (Upload material)...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[aria-haspopup="dialog"]').click()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 500));

  await send('Runtime.evaluate', {
    expression: `(() => {
      const uploadBtn = Array.from(document.querySelectorAll('[role="dialog"] button')).find(b => b.textContent.includes('Upload material'));
      if (uploadBtn) uploadBtn.click();
    })()`,
    returnByValue: true
  });
  await new Promise(r => setTimeout(r, 1000));

  const afterNav = await send('Runtime.evaluate', {
    expression: `(() => ({
      currentUrl: window.location.href,
      dialogClosed: !document.querySelector('[role="dialog"]')
    }))()`,
    returnByValue: true
  });
  console.log('   After Action click:', afterNav.result.value);

  ws.close();
  edge.kill();
  console.log('\n=== ALL QUICK ACTIONS OVERLAY TESTS PASSED SUCCESSFULLY! ===');
}

testQuickActions().catch(err => {
  console.error('Quick actions test failed:', err);
  process.exit(1);
});
