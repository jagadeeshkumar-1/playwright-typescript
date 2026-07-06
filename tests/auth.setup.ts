import { test as setup } from '../fixtures/BaseTest';
import { AUTH_FILE } from '../fixtures/auth';

setup('authenticate', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login('snr@yopmail.com', 'bbLUr.EXxMK@G5v');
  await page.context().storageState({ path: AUTH_FILE });
});