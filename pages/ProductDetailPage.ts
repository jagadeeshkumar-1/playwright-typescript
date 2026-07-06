import { Page } from '@playwright/test';
export class ProductDetailPage {    

    readonly page: Page;

    constructor(page: Page) {
      this.page = page;
    }

    async gotoProductDetailPage() {
      await this.page.goto('/client/#/dashboard/dash');
      await this.page.waitForURL('/client/#/dashboard/dash');
    }

    async viewProduct(productName: string) {
      await this.page.locator(`//b[contains(text(),'${productName}')]/..//following-sibling::button[contains(text(),'View')]`).click();
      await this.page.waitForSelector(`//h2[contains(text(),'${productName}')]`);
    }

    async addToCart() {
      await this.page.locator('button:has-text("Add to Cart")').click();
    }

    async goToCart() {
      await this.page.getByRole('button', { name: '   Cart' }).click();
      await this.page.waitForURL('/client/#/dashboard/cart');
    }

    async getProductName() {
      return await this.page.locator(`//h2[contains(text(), "")]`).textContent();
    }

    async getProductPrice(productName: string) {
      return await this.page.locator(`//h2[contains(text(), "${productName}")]/following-sibling::h3`).textContent();
    }

}