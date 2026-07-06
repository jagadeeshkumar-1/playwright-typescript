import * as fs from 'fs';
import * as path from 'path';
import { Page, TestInfo } from '@playwright/test';

export class ScreenshotsUtil {
    async takeScreenshot(page: Page, screenshotName: string): Promise<void> {
        const screenshotPath = path.join(__dirname, '..', 'screenshots', screenshotName);
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved to ${screenshotPath}`);
    }

    // Called from the afterEach hook once a test is known to have failed/broken,
    // so the page is still open and reflects the state at the point of failure.
    async captureFailureScreenshot(page: Page, testInfo: TestInfo): Promise<Buffer> {
        const sanitizedTitle = testInfo.title.replace(/[^a-z0-9]/gi, '_');
        const screenshotDir = path.join(__dirname, '..', 'screenshots');
        fs.mkdirSync(screenshotDir, { recursive: true });
        const screenshotPath = path.join(screenshotDir, `${sanitizedTitle}-failure.png`);

        const buffer = await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Failure screenshot saved to ${screenshotPath}`);
        return buffer;
    }
}