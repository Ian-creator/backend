const xlsx = require('xlsx');
const path = require('path');

const filePath = 'C:\\Users\\BAMA\\OneDrive\\Desktop\\managent_sys\\frontend\\src\\assets\\wp.xlsx';
try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get raw data without assuming headers to see what's in the first few rows
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log('--- FIRST 10 ROWS (RAW) ---');
    console.log(JSON.stringify(rawData.slice(0, 10), null, 2));

    // Get data with default behavior
    const parsedData = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
    console.log('\n--- FIRST 2 ROWS (PARSED) ---');
    console.log(JSON.stringify(parsedData.slice(0, 2), null, 2));
} catch (err) {
    console.error('Error:', err.message);
}
