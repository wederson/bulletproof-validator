    
import { Parser } from 'json2csv';
import fs from 'fs';

class ExportErrorsToCSV {
    constructor(erros) {
        this.allErrors = erros;
    };

    init() {
        const fields = ['page', 'element', 'error'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(this.allErrors);

        const currentDate = new Date();
        const day = currentDate.getDate();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        const hours = currentDate.getHours();
        const minutes = currentDate.getMinutes();
        const seconds = currentDate.getSeconds();
        const formattedTime = `${hours}-${minutes}-${seconds}`;

        const folderPath = `./exports/${formattedDate}`;
        const filePath = `${folderPath}/${formattedTime}.csv`;

        fs.mkdirSync(folderPath, { recursive: true });
        fs.writeFile(filePath, csv, 'utf8', (err) => {
            if (err) {
            console.error('Error exporting errors to CSV:', err);
            } else {
            console.log(`Errors exported to ${filePath}`);
            }
        });
    }
}

export default ExportErrorsToCSV;