import {test, expect} from '../fixtures/BaseTest';

test.describe('Product Details Page Tests', { tag: '@regression' }, () => {
  // No manual login here — the 'setup' project already authenticated once
  // and every project below reuses that session via storageState.

  test.beforeEach(async ({ productPage }) => {
    await productPage.gotoProductDetailPage();
    await productPage.viewProduct('ADIDAS');
  });

  test('should navigate to product details page and add product to cart', { tag: '@smoke' }, async ({ productPage, page }) => {
   
    await productPage.addToCart();
    await productPage.goToCart();
    await expect(page).toHaveURL('/client/#/dashboard/cart');
  });

  test('Verify the Add to Cart button is present on the product details page', async ({ productPage }) => {
    
    const addToCartButton =  productPage.page.locator('button:has-text("Add to Cart")');
    await expect(addToCartButton).toBeVisible();
  });

  test('Verify the product name and price are present on the product details page', async ({ productPage }) => {
   
    const productName = await productPage.getProductName();
    const productPrice = await productPage.getProductPrice('ADIDAS');
     expect(productName).toContain('ADIDAS');
     expect(productPrice).toBe('$ 11500');
  });

});