const puppeteer = require('puppeteer');

const ROLE_REGEX = /\b(swe|sde|sre|software|intern|fresher|developer|engineer|frontend|backend|fullstack)\b/i;
const EXCLUDE_REGEX = /\b(senior|staff|lead|manager|principal|director|vp|sales|marketing|hr|finance|executive|trainee|support|ii|iii|iv|v|l3|l4|l5|l6|mid|mid-level|experienced)\b/i;
const LOCATION_KEYWORDS = ['india', 'remote', 'bengaluru', 'bangalore', 'mumbai', 'pune', 'hyderabad', 'gurugram', 'gurgaon', 'noida', 'delhi', 'chennai', 'anywhere'];

function isRelevantJob(title, location) {
    if (!title) return false;
    const hasRole = ROLE_REGEX.test(title);
    const isExcluded = EXCLUDE_REGEX.test(title);
    
    let isGoodLocation = true;
    if (location) {
        const lowerLoc = location.toLowerCase();
        isGoodLocation = LOCATION_KEYWORDS.some(kw => lowerLoc.includes(kw));
    }

    return hasRole && !isExcluded && isGoodLocation;
}

// 1. Generic Heuristic Scraper (for the 50 custom companies)
async function scrapeGenericCareerPage(browser, companyName, url) {
    console.log(`Scraping generic page: ${companyName}`);
    let jobs = [];
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
        
        // Extract all links that look like job postings
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a')).map(a => ({
                title: a.innerText.trim(),
                url: a.href,
                // Naive approach: grab some sibling text for location
                location: a.parentElement ? a.parentElement.innerText : 'India'
            }));
        });
        
        jobs = links
            .filter(link => isRelevantJob(link.title, link.location))
            .map(link => ({
                id: `gen_${companyName}_${Buffer.from(link.url).toString('base64').substring(0,10)}`,
                title: link.title,
                company: companyName,
                location: 'India (Extracted)',
                url: link.url,
                ats: 'custom_scraper'
            }));
            
        await page.close();
    } catch (err) {
        console.error(`Failed to scrape ${companyName}:`, err.message);
    }
    return jobs;
}

// 2. Unstop Scraper (Heuristic)
async function scrapeUnstop(browser) {
    console.log(`Scraping Unstop...`);
    // Example URL for Unstop jobs/internships
    const url = 'https://unstop.com/jobs?types=jobs,internships';
    return await scrapeGenericCareerPage(browser, 'Unstop Platform', url);
}

// 3. Talent500 Scraper
async function scrapeTalent500(browser) {
    console.log(`Scraping Talent500...`);
    const url = 'https://talent500.co/jobs';
    return await scrapeGenericCareerPage(browser, 'Talent500', url);
}

// 4. Cutshort Scraper
async function scrapeCutshort(browser) {
    console.log(`Scraping Cutshort...`);
    const url = 'https://cutshort.io/jobs';
    return await scrapeGenericCareerPage(browser, 'Cutshort', url);
}

// 5. HackerEarth Scraper
async function scrapeHackerEarth(browser) {
    console.log(`Scraping HackerEarth...`);
    const url = 'https://www.hackerearth.com/challenges/hiring/';
    return await scrapeGenericCareerPage(browser, 'HackerEarth', url);
}

// 6. Lets-Code Scraper
async function scrapeLetsCode(browser) {
    console.log(`Scraping Lets-Code...`);
    const url = 'https://lets-code.co.in/jobs';
    return await scrapeGenericCareerPage(browser, 'Lets-Code', url);
}

async function runCustomScrapers(topCompanies) {
    console.log('Launching headless browser...');
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    let allJobs = [];

    // Run specific platforms
    allJobs = allJobs.concat(await scrapeUnstop(browser));
    allJobs = allJobs.concat(await scrapeTalent500(browser));
    allJobs = allJobs.concat(await scrapeCutshort(browser));
    allJobs = allJobs.concat(await scrapeHackerEarth(browser));
    allJobs = allJobs.concat(await scrapeLetsCode(browser));

    // Run top companies
    for (const company of topCompanies) {
        if (company.url && company.ats === 'unknown') {
            const jobs = await scrapeGenericCareerPage(browser, company.name, company.url);
            allJobs = allJobs.concat(jobs);
        }
    }

    await browser.close();
    return allJobs;
}

module.exports = { runCustomScrapers };
