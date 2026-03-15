const xlsx = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'assets', 'wp.xlsx');
try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length > 0) {
        console.log('HEADERS:', Object.keys(data[0]));
    } else {
        console.log('No data found in sheet');
    }
} catch (e) {
    console.error('Error reading file:', e);
}
