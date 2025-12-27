const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../data/cardmaster-251225 - onepiece.xlsx');
console.log('Reading file:', filePath);

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Get headers
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (json.length > 0) {
        console.log('Headers:', json[0]);
        console.log('First row example:', json[1]);
    } else {
        console.log('Sheet is empty');
    }
} catch (error) {
    console.error('Error reading excel:', error.message);
}
