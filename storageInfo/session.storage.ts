// REFERENCE ONLY — not wired into playwright.config.ts and not part of the active suite.
//
// This app stores its auth token in localStorage (see auth.setup.ts + fixtures/auth.ts),
// which Playwright's built-in storageState already handles. This file demonstrates the
// technique you'd need INSTEAD if an app stored its token in sessionStorage, which
// storageState() does not capture. Running this against this app will still work without
// errors, but `token` will come back null, since this app never writes to sessionStorage.
//
// Filename intentionally doesn't end in `.setup.ts` or `.spec.ts`, so no project's
// testMatch picks it up — this file won't run as part of `npx playwright test`, even
// if you pass its path explicitly (testMatch filtering happens before that). To actually
// execute it, temporarily rename it to end in `.setup.ts` so the existing `setup`
// project's testMatch (/.*\.setup\.ts/) picks it up, then rename back afterward.

import * as fs from 'fs';
import { test as sessionSetup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

const SESSION_TOKEN_FILE = 'playwright/.auth/session-token.json';

sessionSetup('capture sessionStorage token (reference only)', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('snr@yopmail.com', 'bbLUr.EXxMK@G5v');

  const token = await page.evaluate(() => sessionStorage.getItem('token'));
  fs.writeFileSync(SESSION_TOKEN_FILE, JSON.stringify({ token }));
});

// To REPLAY a captured sessionStorage token into a fresh test (since there's no
// `use: { storageState }` equivalent for sessionStorage), inject it via addInitScript
// so it's set before the app's own JS runs on the first page load:
//
//   test.beforeEach(async ({ context }) => {
//     const { token } = JSON.parse(fs.readFileSync(SESSION_TOKEN_FILE, 'utf-8'));
//     await context.addInitScript((t) => {
//       window.sessionStorage.setItem('token', t);
//     }, token);
//   });
