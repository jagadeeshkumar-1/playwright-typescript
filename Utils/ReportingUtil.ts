import { TestInfo } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { ContentType } from 'allure-js-commons';

export class ReportingUtil {
    // allure.attachment() forwards to testInfo.attach() internally, so this single
    // call is enough to surface the evidence in both the HTML report and Allure.
    async attachFailureArtifacts(testInfo: TestInfo, screenshot: Buffer): Promise<void> {
        await allure.attachment('Failure Screenshot', screenshot, ContentType.PNG);

        const stackTrace = testInfo.error?.stack ?? testInfo.error?.message ?? 'No stack trace available';
        await allure.attachment('Stack Trace', stackTrace, ContentType.TEXT);
    }
}
