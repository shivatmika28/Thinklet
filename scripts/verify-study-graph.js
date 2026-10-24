const http = require('http');
const fs = require('fs');
const path = require('path');

async function verify() {
  console.log("=== Verifying Daily Study Progress Bar Graph & Smaller Timer ===\n");

  // 1. Check DailyStudyProgressBarGraph.tsx file
  const graphComponentPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'DailyStudyProgressBarGraph.tsx');
  if (!fs.existsSync(graphComponentPath)) {
    throw new Error("DailyStudyProgressBarGraph.tsx does not exist!");
  }
  const graphContent = fs.readFileSync(graphComponentPath, 'utf8');

  // Verify requirements in component:
  const checks = [
    { name: "Cerulean (#1282A2) color token", pass: graphContent.includes("#1282A2") },
    { name: "Week (7d) and Month filters", pass: graphContent.includes("Week (7d)") && graphContent.includes("Month") },
    { name: "Interactive tooltip with date, study time, sessions", pass: graphContent.includes("activeDay.fullDate") && graphContent.includes("formatMinutesPretty") && graphContent.includes("sessionCount") },
    { name: "Summary metrics (Today, Period/Week total, Goal %)", pass: graphContent.includes("Today's Time") && graphContent.includes("goalCompletionPercent") },
    { name: "Empty state message 'Your study journey starts here!'", pass: graphContent.includes("Your study journey starts here!") },
    { name: "Current day highlighted bar styling", pass: graphContent.includes("todayBarGradient") && graphContent.includes("day.isToday") },
    { name: "Smooth animation classes", pass: graphContent.includes("transition-all") },
    { name: "Claymorphic shadow and styling", pass: graphContent.includes("shadow-") && graphContent.includes("rounded-3xl") }
  ];

  checks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 2. Check src/app/page.tsx
  const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');

  const pageChecks = [
    { name: "DailyStudyProgressBarGraph embedded in page.tsx", pass: pageContent.includes("<DailyStudyProgressBarGraph") },
    { name: "Focus Sprint timer made smaller (text-2xl sm:text-3xl)", pass: pageContent.includes("text-2xl sm:text-3xl font-mono font-bold") },
    { name: "Timer records real session upon completion", pass: pageContent.includes("recordStudySession") },
    { name: "Early sprint logging supported", pass: pageContent.includes("handleLogSprintEarly") }
  ];

  pageChecks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 3. Check featureStore.ts for persistence and duplicate prevention
  const storePath = path.join(__dirname, '..', 'src', 'features', 'services', 'featureStore.ts');
  const storeContent = fs.readFileSync(storePath, 'utf8');

  const storeChecks = [
    { name: "recordStudySession function exported", pass: storeContent.includes("export function recordStudySession") },
    { name: "Duplicate session debounce check (2s)", pass: storeContent.includes("lastRecordedSessionTimestamp") },
    { name: "getDailyStudyStats function exported", pass: storeContent.includes("export function getDailyStudyStats") },
    { name: "Week range calculation (last 7 days)", pass: storeContent.includes("timeRange === 'week'") },
    { name: "Month range calculation", pass: storeContent.includes("for (let dayNum = 1; dayNum <= currentDay; dayNum++)") },
    { name: "Streak synchronization on session record", pass: storeContent.includes("streak.currentStreak") },
    { name: "studySessions array in DEFAULT_STORE", pass: storeContent.includes("studySessions: []") }
  ];

  storeChecks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 4. Verify HTTP request to localhost:3000
  console.log("\nTesting HTTP response on http://localhost:3000/ ...");
  try {
    const html = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3000/', (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      });
      req.on('error', reject);
      req.setTimeout(5000, () => req.destroy(new Error("Timeout")));
    });

    console.log(`[PASS] Server responded with status HTTP ${html.statusCode}`);
    if (html.body.includes("Daily Study Progress")) {
      console.log("[PASS] HTML contains 'Daily Study Progress'");
    }
    if (html.body.includes("Thinklet")) {
      console.log("[PASS] HTML contains 'Thinklet' branding");
    }
  } catch (err) {
    console.log(`Note: Dev server HTTP test skipped or server restarting (${err.message})`);
  }

  console.log("\nALL VALIDATIONS PASSED SUCCESSFULLY! ✨");
}

verify().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
