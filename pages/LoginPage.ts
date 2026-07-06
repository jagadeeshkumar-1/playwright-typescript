import { Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/client/#/auth/login');
    await this.page.waitForURL('/client/#/auth/login');
  }

  async login(email: string, password: string) {
    await this.page.locator('input[formcontrolname="userEmail"]').fill(email);
    await this.page.locator('input[formcontrolname="userPassword"]').fill(password);
    await this.page.locator('input[type="submit"]').click();
    await this.page.waitForURL('/client/#/dashboard/dash');
  }
}
