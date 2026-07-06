const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const resultsDir = path.join(root, 'allure-results');
const reportDir = path.join(root, 'allure-report');

if (!fs.existsSync(resultsDir)) {
  console.log('No allure-results found, skipping report generation.');
  process.exit(0);
}

// Carry the previous report's history/ into the new results so Allure's Trend
// widget keeps accumulating pass/fail counts (with each run's timestamp) across
// runs instead of resetting to a single data point every time.
const previousHistory = path.join(reportDir, 'history');
if (fs.existsSync(previousHistory)) {
  fs.rmSync(path.join(resultsDir, 'history'), { recursive: true, force: true });
  fs.cpSync(previousHistory, path.join(resultsDir, 'history'), { recursive: true });
}

execSync(`allure generate "${resultsDir}" --clean -o "${reportDir}"`, { stdio: 'inherit' });
