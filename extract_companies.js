const fs = require('fs');
const path = require('path');

const csvFiles = [
    'E:\\work\\resume\\limited_dsa_job_hunt_sheet.csv',
    'E:\\work\\resume\\target_150_dsa_job_hunt_sheet.csv'
];

let companiesMap = new Map();

csvFiles.forEach(file => {
    if (!fs.existsSync(file)) {
        console.warn(`File not found: ${file}`);
        return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Match standard CSV format: "Name","Type"...
        const match = line.match(/^"([^"]+)"/);
        if (match && match[1]) {
            const companyName = match[1];
            if (!companiesMap.has(companyName)) {
                companiesMap.set(companyName, {
                    name: companyName,
                    ats: "unknown", // Need to manually identify or use Jobs API
                    boardToken: companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
                });
            }
        }
    }
});

const companiesArray = Array.from(companiesMap.values());
const outputPath = path.join(__dirname, 'companies.json');

fs.writeFileSync(outputPath, JSON.stringify(companiesArray, null, 2));

console.log(`Successfully extracted ${companiesArray.length} companies to companies.json!`);
