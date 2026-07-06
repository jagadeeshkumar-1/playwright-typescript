import { test, expect } from '../fixtures/BaseTest';

test.describe('Cart Page Tests', { tag: '@regression' }, () => {

 test.beforeEach(async ({ productPage }) => {
    await productPage.gotoProductDetailPage();
    await productPage.viewProduct('ADIDAS');
    await productPage.addToCart();
    await productPage.goToCart();
  });
  
  test('should navigate to cart page', { tag: '@smoke' }, async ({ productPage, page }) => {
    await expect(page).toHaveURL('/client/#/dashboard/cart');
  });

  test('should delete a product from cart', async ({ productPage, cartPage }) => {
    await cartPage.verifyButtons();
  });



});