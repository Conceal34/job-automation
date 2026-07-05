const fs = require('fs');
const path = require('path');
const axios = require('axios');

const csvFiles = [
    'E:\\work\\resume\\limited_dsa_job_hunt_sheet.csv',
    'E:\\work\\resume\\target_150_dsa_job_hunt_sheet.csv'
];

async function detectATS(url) {
    if (!url || !url.startsWith('http')) return null;
    
    try {
        const response = await axios.get(url, { 
            timeout: 5000, 
            headers: { 'User-Agent': 'Mozilla/5.0' },
            validateStatus: () => true 
        });
        
        const html = response.data;
        if (typeof html !== 'string') return null;

        if (html.includes('boards.greenhouse.io') || html.includes('api.greenhouse.io') || response.request.res.responseUrl.includes('greenhouse.io')) {
            // Try to extract token
            const match = html.match(/boards\.greenhouse\.io\/([a-zA-Z0-9_-]+)/);
            return { ats: 'greenhouse', token: match ? match[1] : null };
        }
        if (html.includes('jobs.lever.co') || response.request.res.responseUrl.includes('lever.co')) {
            const match = html.match(/jobs\.lever\.co\/([a-zA-Z0-9_-]+)/);
            return { ats: 'lever', token: match ? match[1] : null };
        }
        if (html.includes('myworkdayjobs.com')) return { ats: 'workday', token: null };
        
        return null;
    } catch (e) {
        return null;
    }
}

async function run() {
    let companiesMap = new Map();

    for (const file of csvFiles) {
        if (!fs.existsSync(file)) continue;
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // Basic CSV parse (handles commas inside quotes somewhat)
            const cols = line.split(/,"|",|^"|"?$/).filter(c => c !== undefined).map(c => c.trim());
            // Based on earlier view, Company Name is typically index 1 after split if it starts with quote, 
            // Let's use a better regex to parse CSV
            const matches = [...line.matchAll(/(?:^|,)(?:"([^"]*)"|([^,]*))/g)];
            const row = matches.map(m => m[1] || m[2]);

            if (row.length >= 8 && row[0]) {
                const companyName = row[0];
                const url = row[7];
                
                if (!companiesMap.has(companyName)) {
                    companiesMap.set(companyName, {
                        name: companyName,
                        url: url,
                        ats: "unknown",
                        boardToken: companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
                    });
                }
            }
        }
    }

    const companies = Array.from(companiesMap.values());
    console.log(`Checking ATS for ${companies.length} companies. This may take a minute...`);
    
    // Process in batches of 10 to be polite and fast
    const batchSize = 10;
    for (let i = 0; i < companies.length; i += batchSize) {
        const batch = companies.slice(i, i + batchSize);
        await Promise.all(batch.map(async (company) => {
            if (company.url) {
                const result = await detectATS(company.url);
                if (result) {
                    company.ats = result.ats;
                    if (result.token) company.boardToken = result.token;
                    console.log(`Found ATS for ${company.name}: ${company.ats} (${company.boardToken})`);
                }
            }
        }));
    }

    const outputPath = path.join(__dirname, 'companies.json');
    fs.writeFileSync(outputPath, JSON.stringify(companies, null, 2));
    
    const greenhouse = companies.filter(c => c.ats === 'greenhouse').length;
    const lever = companies.filter(c => c.ats === 'lever').length;
    console.log(`\nDone! Found ${greenhouse} Greenhouse and ${lever} Lever setups. Saved to companies.json`);
}

run();
