import { test as setup } from '../fixtures/BaseTest';
import { AUTH_FILE } from '../fixtures/auth';

setup('authenticate', async ({ page, loginPage }) => {
  await loginPage.goto();
  await loginPage.login(process.env.TEST_USERNAME || 'snr@yopmail.com', process.env.TEST_PASSWORD || 'bbLUr.EXxMK@G5v');
  await page.context().storageState({ path: AUTH_FILE });
});