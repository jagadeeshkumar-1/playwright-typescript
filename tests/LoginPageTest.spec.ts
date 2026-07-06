import { test, expect } from '../fixtures/BaseTest';

test.describe('Login Page Tests', { tag: '@regression' }, () => {
  // These tests exercise the unauthenticated flow, so ignore the
  // project-level storageState (which starts every other test pre-logged-in).
  test.use({ storageState: { cookies: [], origins: [] } });

   test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('should display the login page', async ({ page, loginPage }) => {
    await expect(page).toHaveTitle("Let's Shop");
    });

    test('should login with valid credentials', { tag: '@smoke' }, async ({ loginPage, page }) => {
    await loginPage.login('snr@yopmail.com', 'bbLUr.EXxMK@G5v');
    await expect(page).toHaveURL('/client/#/dashboard/dash');
    });

    test('verify product details page navigation and add to cart functionality', async ({ loginPage, productPage, page }) => {
    await loginPage.login('snr@yopmail.com', 'bbLUr.EXxMK@G5v');
    await productPage.gotoProductDetailPage();
    await productPage.viewProduct('ADIDAS');
    await productPage.addToCart();
    await productPage.goToCart();
    await expect(page).toHaveURL('/client/#/dashboard/cart');
    });
})