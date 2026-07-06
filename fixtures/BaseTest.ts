import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ScreenshotsUtil } from '../Utils/ScreenshotsUtil';
import { ReportingUtil } from '../Utils/ReportingUtil';

const screenshotsUtil = new ScreenshotsUtil();
const reportingUtil = new ReportingUtil();

type Fixtures = {
  loginPage: LoginPage;
  productPage: ProductDetailPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  productPage: async ({ page }, use) => {
    await use(new ProductDetailPage(page));
  },

  cartPage: async ({page}, use) => {
    await use(new CartPage(page));
  },

  checkoutPage: async ({page}, use) => {
    await use(new CheckoutPage(page));
  }
});

// Runs before every test that imports `test` from this file — the
// Playwright equivalent of code in a Java @BeforeMethod.
// A fresh `page` (new tab, isolated context) is already provided by
// Playwright itself before this hook runs, and will be closed
// automatically after the test — no manual open/close needed here.
test.beforeEach(async ({ page }) => {
  console.log('New tab opened for test, starting at:', page.url());
});

test.afterEach(async ({ page }, testInfo) => {
  console.log('Test finished, closing tab at:', page.url());

  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await screenshotsUtil.captureFailureScreenshot(page, testInfo);
    await reportingUtil.attachFailureArtifacts(testInfo, screenshot);
  }
});

export { expect };
