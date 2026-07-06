import {Page} from '@playwright/test';

export class CheckoutPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getCountry() {
    return this.page.getByRole('textbox', { name: 'Select Country' });
  }

   verifyDownloadInvoiceButton() {
   return this.page.getByRole('button', { name: 'Click To Download Order Details in CSV' });
  }

}