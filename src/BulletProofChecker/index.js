
import ProgressBar from 'progress';
import https from 'https';
import puppeteer from 'puppeteer';
import DataElementChecker from '../DataElementChecker/index.js';
import ExportErrorsToCSV from '../Utils/ExportErrosToCSV.js';

class BulletProofChecker {
    constructor(pages) {
        this.pages = pages;
        this.agent = new https.Agent({
            rejectUnauthorized: false
        });
        this.allErrors = [];
    }

    async processPage(page) {
        try {
            const browser = await puppeteer.launch({
                headless: false,
                args: ['--user-data-dir=./user_data']
            });

            const pageObj = await browser.newPage();
            await pageObj.goto(page, { waitUntil: 'networkidle0' });

            const html = await pageObj.content();
            if (!html) {
                throw new Error(`Error reading page ${page}: No access to HTML`);
            }

            // Initialize dataErrors
            let dataLayerChecker = [];

            // Wait for 2 seconds before checking dataLayer
            await new Promise(resolve => setTimeout(resolve, 2000));

            await this.PageLoadChecker(pageObj, page, dataLayerChecker);

            await this.VWOChecker(pageObj, page, dataLayerChecker);

            await browser.close();

            const checker = new DataElementChecker(html, page);
            const { isValid, dataErrors } = await checker.init();

            // Check if GTM script is loaded
            this.GTMChecker(html, page, dataErrors);

            // Add the errors from this page to the allErrors array
            this.allErrors.push(...dataErrors, ...dataLayerChecker);

            if (!isValid) {
                console.error(`Errors found on page ${page}:`);
                console.error('Errors:', [...dataErrors, ...dataLayerChecker]);
            }
        } catch (error) {
            console.error(`Error reading page ${page}: ${error.message}`);
        }
    }

    GTMChecker(html, page, dataErrors) {
        const isGTMLoaded = html.includes('https://www.googletagmanager.com/gtm.js');

        if (isGTMLoaded) {
            const error = {
                page,
                element: 'GTM Script',
                error: 'GTM script LOADED'
            };
            dataErrors.push(error);
        } else {
            const error = {
                page,
                element: 'GTM Script',
                error: 'GTM script NOT loaded'
            };
            dataErrors.push(error);
        }
    }

    async VWOChecker(pageObj, page, dataLayerChecker) {
        const isVwoCodeObjectExists = await pageObj.evaluate(() => {
            return window._vwo_code !== undefined;
        });

        if (isVwoCodeObjectExists) {
            const error = {
                page,
                element: 'VWO Code',
                error: 'VWO code object EXISTS'
            };
            dataLayerChecker.push(error);
        } else {
            const error = {
                page,
                element: 'VWO Code',
                error: 'VWO code object NOT exists'
            };
            dataLayerChecker.push(error);
        }
    }

    async PageLoadChecker(pageObj, page, dataLayerChecker) {
        const isPageLoadedEventInDataLayer = await pageObj.evaluate(() => {
            return window.dataLayer && window.dataLayer.some(event => event.event === 'page_loaded');
        });

        if (isPageLoadedEventInDataLayer) {
            const error = {
                page,
                element: 'DataLayer Event',
                error: 'Page loaded event FOUND in dataLayer'
            };
            dataLayerChecker.push(error);
        } else {
            const error = {
                page,
                element: 'DataLayer Event',
                error: 'Page loaded event NOT found in dataLayer'
            };
            dataLayerChecker.push(error);
        }
    }

    async run() {
        const progressBar = new ProgressBar('[:bar] :percent :etas', {
            total: this.pages.length,
            width: 40
        });

        for (const page of this.pages) {
            await this.processPage(page);
            progressBar.tick();
        }

        const exportErro = new ExportErrorsToCSV(this.allErrors);
        exportErro.init();
    }

}

export default BulletProofChecker;
