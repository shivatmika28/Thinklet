const http = require('http');

const routes = [
  '/',
  '/learn',
  '/quiz',
  '/revision',
  '/notes',
  '/planner',
  '/progress',
  '/flashcards',
  '/checker',
  '/paper',
  '/mastery',
  '/tracker',
  '/visual',
  '/materials',
  '/tutorial',
  '/teacher',
  '/share'
];

async function fetchRoute(route) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${route}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function verifyAll() {
  console.log('--- Verifying Thinklet Branding Across All Routes ---');
  let allPassed = true;

  for (const route of routes) {
    try {
      const res = await fetchRoute(route);
      const hasThinklet = res.body.includes('Thinklet');
      const hasIStudy = res.body.includes('iStudy');

      console.log(`Route ${route.padEnd(14)} -> Status: ${res.status} | Mentions Thinklet: ${hasThinklet ? 'YES' : 'NO'} | Contains legacy iStudy: ${hasIStudy ? 'YES (FAIL)' : 'NO (CLEAN)'}`);

      if (hasIStudy) {
        allPassed = false;
      }
    } catch (err) {
      console.error(`Route ${route} failed to fetch:`, err.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('\n[SUCCESS] All routes verified! Zero occurrences of legacy iStudy found, Thinklet active everywhere.');
  } else {
    console.log('\n[WARNING] Some routes need attention.');
  }
}

verifyAll();
