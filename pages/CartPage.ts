import {Page, expect} from '@playwright/test';
//import { expect } from '../fixtures/BaseTest';

export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getCartItems() {
    return this.page.locator('.cart-item');
  }

  async getCartItemCount() {
    const items = await this.getCartItems();
    return await items.count();
  }

  async getCartTotal() {
    return this.page.locator('.cart-total');
  }

  async BuyNowButton() {
    return this.page.locator('button:has-text("Buy Now")');
  }

  async ClickdeleteproductButton() {
    this.page.locator(`.btn.btn-danger`);
    await expect(this.page.locator(`.btn.btn-danger`)).toBeVisible();
    return await this.page.locator(`.btn.btn-danger`).click();
  }

  async verifyButtons() {
    const deleteButton = this.page.locator(`.btn.btn-danger`);
    const buyNowButton = this.page.locator('button:has-text("Buy Now")');
    await expect(deleteButton).toBeVisible();
    await expect(buyNowButton).toBeVisible();
  }


}