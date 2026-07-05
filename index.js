require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { fetchAllJobs } = require('./fetchers');
const { runCustomScrapers } = require('./platform_scrapers');
const { sendEmailNotification } = require('./notifier');
const { addJobsToTasks } = require('./tasks');

const COMPANIES_FILE = path.join(__dirname, 'companies.json');
const SEEN_JOBS_FILE = path.join(__dirname, 'seen_jobs.json');

async function run() {
    console.log('Starting job scraper...');
    
    // Load companies
    const companies = JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf8'));
    
    // Load state
    let seenJobs = [];
    if (fs.existsSync(SEEN_JOBS_FILE)) {
        seenJobs = JSON.parse(fs.readFileSync(SEEN_JOBS_FILE, 'utf8'));
    }

    // Fetch API jobs
    let allJobs = await fetchAllJobs(companies);
    
    // Run custom Puppeteer scrapers for the platforms & top 50 companies
    console.log('Running headless browser scrapers...');
    const topCompanies = companies.slice(0, 50); // Get the first 50 companies
    const customJobs = await runCustomScrapers(topCompanies);
    allJobs = allJobs.concat(customJobs);

    
    // Filter new jobs
    const newJobs = allJobs.filter(job => !seenJobs.includes(job.id));
    
    console.log(`Found ${newJobs.length} new jobs matching criteria.`);

    // Send email always (even if 0 jobs found)
    if (process.env.RESEND_API_KEY) {
        await sendEmailNotification(newJobs);
    } else {
        console.log('Skipping email: RESEND_API_KEY not configured.');
    }

    if (newJobs.length > 0) {
        // Add to Google Tasks
        if (process.env.GOOGLE_REFRESH_TOKEN) {
            await addJobsToTasks(newJobs);
        } else {
            console.log('Skipping tasks: GOOGLE_REFRESH_TOKEN not configured.');
        }

        // Update state
        const newSeenJobs = [...seenJobs, ...newJobs.map(job => job.id)];
        fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(newSeenJobs, null, 2));
        console.log('State updated.');
    }

    console.log('Job scraper finished.');
}

run().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
