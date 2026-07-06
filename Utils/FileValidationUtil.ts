import * as fs from 'fs';
import * as path from 'path';
import { Download } from '@playwright/test';

export class FileValidationUtil {
    private readonly downloadsDir = path.join(__dirname, '..', 'downloads');

    // Saves the Playwright Download into our own downloads folder (instead of
    // its default temp location) so the path is predictable and easy to clean up.
    async saveDownload(download: Download): Promise<string> {
        fs.mkdirSync(this.downloadsDir, { recursive: true });
        const filePath = path.join(this.downloadsDir, download.suggestedFilename());
        await download.saveAs(filePath);
        return filePath;
    }

    readCsvFile(filePath: string): string[][] {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content
            .trim()
            .split('\n')
            .map(line => line.split(',').map(cell => cell.trim()));
    }

    // The invoice CSV has a title line above the real header row (e.g. "order-invoice_snr"),
    // so we skip everything before the row starting with "S.No" and key each data row by header.
    readCsvAsRecords(filePath: string): Record<string, string>[] {
        const rows = this.readCsvFile(filePath);
        const headerIndex = rows.findIndex(row => row[0] === 'S.No');
        if (headerIndex === -1) {
            throw new Error(`Could not find header row (starting with "S.No") in ${filePath}`);
        }

        const [header, ...dataRows] = rows.slice(headerIndex);
        return dataRows.map(row =>
            Object.fromEntries(header.map((column, index) => [column, row[index]]))
        );
    }

    deleteFile(filePath: string): void {
        fs.rmSync(filePath, { force: true });
    }
}
