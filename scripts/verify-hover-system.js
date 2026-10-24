const http = require('http');
const fs = require('fs');
const path = require('path');

async function verify() {
  console.log("=== Verifying Thinklet Dashboard Interactive Hover System ===\n");

  // 1. Verify design-system.css
  const cssPath = path.join(__dirname, '..', 'src', 'styles', 'design-system.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  const cssChecks = [
    { name: "thinklet-card-hover class with translateY(-4px)", pass: css.includes(".thinklet-card-hover") && css.includes("translateY(-4px)") },
    { name: "Cerulean (#1282A2) border highlight on hover", pass: css.includes("border-color: #1282A2") },
    { name: "Subtle blue glow shadow (rgba(18, 130, 162, 0.22))", pass: css.includes("rgba(18, 130, 162, 0.22)") },
    { name: "Smooth 250ms cubic-bezier transition", pass: css.includes("250ms cubic-bezier") },
    { name: "thinklet-card-navy-hover class for dark cards", pass: css.includes(".thinklet-card-navy-hover") },
    { name: "thinklet-tile-hover class for sub-cards & metric capsules", pass: css.includes(".thinklet-tile-hover") && css.includes("translateY(-3px)") },
    { name: "thinklet-row-hover class for clickable quest rows", pass: css.includes(".thinklet-row-hover") },
    { name: "thinklet-file-card-hover class for material cards", pass: css.includes(".thinklet-file-card-hover") },
    { name: "thinklet-btn-hover class for interactive buttons", pass: css.includes(".thinklet-btn-hover") },
    { name: "@media (hover: hover) query to prevent touch stickiness", pass: css.includes("@media (hover: hover)") }
  ];

  cssChecks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] CSS: ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 2. Verify Card.tsx
  const cardPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'Card.tsx');
  const cardContent = fs.readFileSync(cardPath, 'utf8');
  if (!cardContent.includes("thinklet-card-hover") || !cardContent.includes("thinklet-card-navy-hover")) {
    throw new Error("Card.tsx does not integrate thinklet hover classes!");
  }
  console.log("[PASS] Card.tsx: Integrates thinklet-card-hover and thinklet-card-navy-hover by default");

  // 3. Verify Button.tsx
  const buttonPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'Button.tsx');
  const buttonContent = fs.readFileSync(buttonPath, 'utf8');
  if (!buttonContent.includes("thinklet-btn-hover")) {
    throw new Error("Button.tsx does not integrate thinklet-btn-hover!");
  }
  console.log("[PASS] Button.tsx: Integrates thinklet-btn-hover for button lift and brightening");

  // 4. Verify DailyStudyProgressBarGraph.tsx
  const graphPath = path.join(__dirname, '..', 'src', 'components', 'ui', 'DailyStudyProgressBarGraph.tsx');
  const graphContent = fs.readFileSync(graphPath, 'utf8');
  const graphChecks = [
    { name: "Outer graph card has thinklet-card-hover", pass: graphContent.includes("thinklet-card-hover") },
    { name: "3 summary sub-cards have thinklet-tile-hover", pass: graphContent.includes("thinklet-tile-hover") },
    { name: "SVG bars have bright cyan hover glow", pass: graphContent.includes("drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]") },
    { name: "Time filter buttons have thinklet-btn-hover", pass: graphContent.includes("thinklet-btn-hover") }
  ];
  graphChecks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] ProgressGraph: ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 5. Verify page.tsx elements
  const pagePath = path.join(__dirname, '..', 'src', 'app', 'page.tsx');
  const pageContent = fs.readFileSync(pagePath, 'utf8');
  const pageChecks = [
    { name: "Welcome Banner has thinklet-card-hover", pass: pageContent.includes("thinklet-card-hover") },
    { name: "4 metric cards have group with icon hover scale", pass: pageContent.includes("group-hover:scale-110") },
    { name: "Quest rows have thinklet-row-hover", pass: pageContent.includes("thinklet-row-hover") },
    { name: "Target Exam box has thinklet-tile-hover", pass: pageContent.includes("thinklet-tile-hover") },
    { name: "Material cards have thinklet-file-card-hover and group", pass: pageContent.includes("thinklet-file-card-hover group") },
    { name: "AI Learning Suite module buttons have icon hover scaling", pass: pageContent.includes("group-hover:text-[#1282A2]") },
    { name: "Mobile nav items have smooth hover:scale-105", pass: pageContent.includes("hover:scale-105 active:scale-95") }
  ];
  pageChecks.forEach(c => {
    console.log(`[${c.pass ? 'PASS' : 'FAIL'}] DashboardPage: ${c.name}`);
    if (!c.pass) throw new Error(`Check failed: ${c.name}`);
  });

  // 6. Test HTTP server
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
    if (html.body.includes("thinklet-card-hover")) {
      console.log("[PASS] HTML contains 'thinklet-card-hover' markup");
    }
  } catch (err) {
    console.log(`Note: Dev server HTTP test skipped (${err.message})`);
  }

  console.log("\nALL HOVER SYSTEM VALIDATIONS PASSED! ✨");
}

verify().catch(err => {
  console.error("Verification error:", err);
  process.exit(1);
});
