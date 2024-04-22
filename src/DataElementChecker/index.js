import cheerio from 'cheerio';

class DataElementChecker {
    constructor(html, page) {
        this.html = html;
        this.page = page;
        this.elementsToCheck = ['a', 'input', 'button', 'option', 'select'];
        this.dataErrors = [];
        /**
         * Regular expression pattern to match a specific format for section, button, link, banner, card, input, check, radio, area, option, select, and accordion names.
         * The format should start with one of the specified elements followed by an underscore and alphanumeric characters, with optional hyphens or underscores in between.
         * @type {RegExp}
         */
        this.bulletPattern = '^(section|button|link|banner|card|input|check|radio|area|option|select|accordion)_[a-zA-Z0-9]+([_-][a-zA-Z0-9]+)*$';

    }

    async init() {
        const $ = cheerio.load(this.html);

        this.CheckValuePattern($);

        this.CheckDataElementExist($);

        return {
            isValid: this.dataErrors.length === 0,
            dataErrors: this.dataErrors
        };
    }

    CheckDataElementExist($) {
        this.elementsToCheck.forEach((element) => {
            const selector = `${element}:not([data-element])`;
            $(selector).each((index, element) => {
                if (!$(element).parents('[data-element]').length) {
                    const error = {
                        page: this.page,
                        element: $(element).html(),
                        error: 'Data element not found in parent element'
                    };
                    this.dataErrors.push(error);
                }
            });
        });
    }

    CheckValuePattern($) {
        $('[data-section], [data-element]').each((index, element) => {
            const dataAttr = $(element).attr('data-section') || $(element).attr('data-element');

            const pattern = new RegExp(this.bulletPattern);

            if (!pattern.test(dataAttr)) {
                const error = {
                    page: this.page,
                    element: dataAttr,
                    error: 'Invalid naming pattern'
                };
                if ($(element).attr('data-section')) {
                    this.dataErrors.push(error);
                } else {
                    this.dataErrors.push(error);
                }
            }
        });
    }
}


export default DataElementChecker;