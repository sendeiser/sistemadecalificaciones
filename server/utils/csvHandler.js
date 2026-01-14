const csv = require('csv-parser');
const fs = require('fs');

const parseCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                fs.unlinkSync(filePath); // Delete file after processing
                resolve(results);
            })
            .on('error', (error) => {
                fs.unlinkSync(filePath); // Ensure deletion on error
                reject(error);
            });
    });
};

module.exports = { parseCSV };
