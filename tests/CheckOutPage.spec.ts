import {test, expect} from '../fixtures/BaseTest';
import { FileValidationUtil } from '../Utils/FileValidationUtil';

const fileValidationUtil = new FileValidationUtil();

test.describe('Checkout Page Tests', () => {
  test.beforeEach(async ({ productPage, cartPage, checkoutPage }) => {
    await productPage.gotoProductDetailPage();
    await productPage.goToCart();
    await cartPage.clearCart();
    await productPage.gotoProductDetailPage();
    await productPage.viewProduct('ZARA');
    await productPage.addToCart();
    await productPage.goToCart();
    await (await cartPage.BuyNowButton()).click();

  });

  test('should navigate to checkout page', async ({ checkoutPage, page }) => {
    await expect(page).toHaveURL(/\/client\/#\/dashboard\/order/);
  });

  test('should verify the presence of checkout form fields', async ({ checkoutPage }) => {
    const countryField = await checkoutPage.getCountry();
    await expect(countryField).toBeVisible();
 });

 test('place the order after filling the checkout form', async ({ checkoutPage, page }) => {
    const countryField = await checkoutPage.getCountry();
    await countryField.pressSequentially('India');
    await page.getByText('India', { exact: true }).click();
    await page.getByText('Place Order', { exact: true }).click();
    const orderConfirmationMessage = page.locator('h1:has-text(" Thankyou for the order.")');
    await expect(orderConfirmationMessage).toBeVisible();
    expect(checkoutPage.verifyDownloadInvoiceButton()).toBeVisible();
  });

  test('Verify downloaded file name and content', async ({ checkoutPage, page, browserName }) => {
    // This site generates the CSV as a client-side blob: URL. Playwright's
    // download-event capture for blob downloads is reliable in Chromium (CDP)
    // but flaky/unsupported in Firefox and WebKit, so we scope this test to Chromium.
    test.skip(browserName !== 'chromium', 'Blob download event is unreliable outside Chromium');

    const countryField = await checkoutPage.getCountry();
    await countryField.pressSequentially('India');
    await page.getByText('India', { exact: true }).click();
    await page.getByText('Place Order', { exact: true }).click();
    // waitForEvent must be armed before the click that triggers the download,
    // so both are started together via Promise.all rather than sequentially.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      checkoutPage.verifyDownloadInvoiceButton().click(),
    ]);

    const filePath = await fileValidationUtil.saveDownload(download);
    const [invoiceRecord] = fileValidationUtil.readCsvAsRecords(filePath);

    expect(invoiceRecord['Product Name']).toContain('ZARA');
    expect(invoiceRecord['Ordered By']).toContain('snr@yopmail.com');

    fileValidationUtil.deleteFile(filePath);
  });
});