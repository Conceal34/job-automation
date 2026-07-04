const axios = require('axios');

const ROLE_KEYWORDS = ['swe', 'software', 'sde', 'sre', 'intern', 'fresher', 'developer', 'engineer'];
const EXCLUDE_KEYWORDS = ['senior', 'staff', 'lead', 'manager', 'principal', 'director', 'vp'];

function isRelevantJob(title) {
    const lowerTitle = title.toLowerCase();
    const hasRole = ROLE_KEYWORDS.some(kw => lowerTitle.includes(kw));
    const isExcluded = EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw));
    return hasRole && !isExcluded;
}

async function fetchGreenhouseJobs(boardToken) {
    try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;
        const response = await axios.get(url);
        const jobs = response.data.jobs || [];
        return jobs
            .filter(job => isRelevantJob(job.title))
            .map(job => ({
                id: `gh_${job.id}`,
                title: job.title,
                company: boardToken,
                location: job.location.name,
                url: job.absolute_url,
                ats: 'greenhouse'
            }));
    } catch (error) {
        console.error(`Error fetching Greenhouse jobs for ${boardToken}:`, error.message);
        return [];
    }
}

async function fetchLeverJobs(boardToken) {
    try {
        const url = `https://api.lever.co/v0/postings/${boardToken}`;
        const response = await axios.get(url);
        const jobs = response.data || [];
        return jobs
            .filter(job => isRelevantJob(job.text))
            .map(job => ({
                id: `lv_${job.id}`,
                title: job.text,
                company: boardToken,
                location: job.categories.location,
                url: job.hostedUrl,
                ats: 'lever'
            }));
    } catch (error) {
        console.error(`Error fetching Lever jobs for ${boardToken}:`, error.message);
        return [];
    }
}

async function fetchAllJobs(companies) {
    let allJobs = [];
    for (const company of companies) {
        let jobs = [];
        if (company.ats === 'greenhouse') {
            jobs = await fetchGreenhouseJobs(company.boardToken);
        } else if (company.ats === 'lever') {
            jobs = await fetchLeverJobs(company.boardToken);
        }
        allJobs = allJobs.concat(jobs);
    }
    return allJobs;
}

module.exports = { fetchAllJobs };
