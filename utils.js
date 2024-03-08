const fs = require('fs');

// Function to convert month number to month name
function getMonthName(monthNumber) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[monthNumber - 1];
}

// Function to update statistics for each item in the month
function updateItemStatistics(monthName, sku, quantity, total, monthItemStatistics) {
    // Check if the month is already present in the statistics, if not, initialize it
    if (!monthItemStatistics.has(monthName)) {
        monthItemStatistics.set(monthName, new Map()); //use Map for SKU based grouping
    }
    // Check if the SKU is already present in the month, if not, initialize it
    if (!monthItemStatistics.get(monthName).has(sku)) {
        monthItemStatistics.get(monthName).set(sku, { quantity: 0, revenue: 0, count: 0, minOrders: Infinity, maxOrders: -Infinity });
    }
    const itemStats = monthItemStatistics.get(monthName).get(sku);
    // Update the quantity, revenue, and count for the SKU
    itemStats.quantity += quantity;
    itemStats.revenue += total;
    itemStats.count++;
    
    // itemStats.minOrders = Math.min(itemStats.minOrders, quantity);
    // itemStats.maxOrders = Math.max(itemStats.maxOrders, quantity);
    
    // Update the minimum and maximum orders for the SKU
    if (quantity < itemStats.minOrders) {
        itemStats.minOrders = quantity;
    }
    if (quantity > itemStats.maxOrders) {
        itemStats.maxOrders = quantity;
    }
}

// Function to calculate monthly statistics
function calculateMonthlyStatistics(monthItemStatistics) {
    const monthlyStatistics = {};
    let totalSales = 0;

    for (const [month, items] of monthItemStatistics) {
        // Initialize variables to store metrics for each month
        let mostPopularItemQty = -Infinity;
        let mostPopularItem;
        let mostPopularItemName;
        let mostRevenue = -Infinity;
        let mostRevenueItem;
        let mostRevenueItemName;
        let totalOrders = 0;
        let totalMonthlySales = 0;
        
        // Iterate through items in the month to calculate metrics
        items.forEach((item, sku) => {
            // Accumulate total orders, total sales, and total monthly sales
            totalOrders += item.quantity;
            totalSales += item.revenue;
            totalMonthlySales += item.revenue;
            
            // Update most popular item and most revenue item if necessary
            if (item.quantity > mostPopularItemQty) {
                mostPopularItemQty = item.quantity;
                mostPopularItem = item ;
                mostPopularItemName = sku;
            }
            if (item.revenue > mostRevenue) {
                mostRevenue = item.revenue;
                mostRevenueItem = item;
                mostRevenueItemName = sku;
            }
        });
        
        // Calculate average orders for the most popular item
        const mostPopularItemAvgOrders = mostPopularItem && mostPopularItem.count !== 0 ?
            parseFloat((mostPopularItem.quantity / mostPopularItem.count).toFixed(2)) :
            0;
        
        // Store metrics for the month in the monthly statistics object
        monthlyStatistics[month] = {
            mostPopularItem: mostPopularItemName,
            mostRevenueItem: mostRevenueItemName,
            mostPopularItemQty,
            mostPopularItemMinOrders: mostPopularItem ? mostPopularItem.minOrders : 'N/A',
            mostPopularItemMaxOrders: mostPopularItem ? mostPopularItem.maxOrders : 'N/A',
            mostPopularItemAvgOrders: isNaN(mostPopularItemAvgOrders) ? 'N/A' : mostPopularItemAvgOrders,
            mostRevenue,
            totalMonthlySales
        };
    }
    
    // Return the monthly statistics and total sales
    return {
        monthlyStatistics,
        totalSales
    };
}


// Function to print monthly statistics
function printMonthlyStatistics(monthlyStatistics, totalSales, outputFile) {
    let output = 'Monthly statistics:\n';
    output += `  Total sales: ${totalSales}\n`;

    for (const month in monthlyStatistics) {
        output += `${month}:\n`;
        const stats = monthlyStatistics[month];
        output += `  Total sales in month: ${stats.totalMonthlySales}\n`;
        output += `  Most popular item: ${stats.mostPopularItem} (Quantity: ${stats.mostPopularItemQty})\n`;
        output += `  Most revenue item: ${stats.mostRevenueItem} (Total Revenue: ${stats.mostRevenue})\n`;
        output += `  Min orders: ${stats.mostPopularItemMinOrders}\n`;
        output += `  Max orders: ${stats.mostPopularItemMaxOrders}\n`;
        output += `  Average orders: ${stats.mostPopularItemAvgOrders}\n`;
    }

    // Log to console
    console.log(output);

    // Write to file
    fs.writeFile(outputFile, output, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Monthly statistics written to', outputFile);
        }
    });
}

// Function to process each line
function processLine(line, monthItemStatistics) {
    // Split the line by comma and destructure to extract individual fields
    const [date, sku, unitPrice, quantity, totalPrice] = line.split(',').map(item => item.trim());

    // Ensure all required fields are present
    if (!date || !sku || !quantity || !totalPrice) {
        console.error(`Invalid input: ${line}`);
        return;
    }

    // Extract the month from the date (assuming date is in 'YYYY-MM-DD' format)
    const monthNumber = parseInt(date.split('-')[1]);
    if (isNaN(monthNumber) || monthNumber < 1 || monthNumber > 12) {
        console.error(`Invalid date format or month number in line: ${line}`);
        return;
    }
    const monthName = getMonthName(monthNumber);

    // Validate total price and quantity
    const total = parseFloat(totalPrice);
    const qty = parseInt(quantity);
    if (isNaN(total) || isNaN(qty) || total <= 0 || qty <= 0) {
        console.error(`Invalid total price or quantity in line: ${line}`);
        return;
    }
    // Update statistics for the item in the month
    updateItemStatistics(monthName, sku, qty, total, monthItemStatistics); 
}

module.exports = {
    processLine,
    calculateMonthlyStatistics,
    printMonthlyStatistics
};
