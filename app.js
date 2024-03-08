const fs = require('fs');
const readline = require('readline');
const { processLine, calculateMonthlyStatistics, printMonthlyStatistics } = require('./utils');
// const { performance } = require('perf_hooks');

// Function to read file using streams
function processFile(filename, outputFile) {
    

    // Create a map to store monthly item statistics. Alternatively can use an array at the first level(month wise grouping) and Map for second level (for sku type grouping)
    const monthItemStatistics = new Map();

    // Create a readable stream to read the file
    const inputStream = fs.createReadStream(filename);

    // Create a readline interface to read lines from the input stream
    const rl = readline.createInterface({
        input: inputStream,
        crlfDelay: Infinity // To handle both \r\n and \n line endings
    });

    // Flag to identify the first line
    let isFirstLine = true;

    // Event listener for each line read from the file
    rl.on('line', line => {
        // Skip the first line (column names)
        if (isFirstLine) {
            isFirstLine = false;
            return;
        }
        // Process each line to update monthly item statistics
        processLine(line, monthItemStatistics);
    });

    // Event listener for when the file reading is complete
    rl.on('close', () => {
        console.log('File processing complete.');

        // Calculate monthly statistics and total sales after all lines processed and we have the entire grouped data
        const { monthlyStatistics, totalSales } = calculateMonthlyStatistics(monthItemStatistics);
        // Print monthly statistics to console and write to output file
        printMonthlyStatistics(monthlyStatistics, totalSales, outputFile);
    });

    // Event listener for errors during file reading
    rl.on('error', err => {
        console.error('Error reading file:', err);
    });

}

// Call the function to process the file
processFile('./Data/sales_data.txt', './Data/monthly_statistics_output.txt');