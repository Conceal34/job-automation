const axios = require('axios');

const ROLE_KEYWORDS = ['swe', 'software', 'sde', 'sre', 'intern', 'fresher', 'developer', 'engineer'];
const EXCLUDE_KEYWORDS = ['senior', 'staff', 'lead', 'manager', 'principal', 'director', 'vp'];

function isRelevantJob(title) {
    if (!title) return false;
    const lowerTitle = title.toLowerCase();
    const hasRole = ROLE_KEYWORDS.some(kw => lowerTitle.includes(kw));
    const isExcluded = EXCLUDE_KEYWORDS.some(kw => lowerTitle.includes(kw));
    return hasRole && !isExcluded;
}

async function fetchGreenhouseJobs(boardToken) {
    try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;
        const response = await axios.get(url, { validateStatus: () => true });
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
        return [];
    }
}

async function fetchLeverJobs(boardToken) {
    try {
        const url = `https://api.lever.co/v0/postings/${boardToken}`;
        const response = await axios.get(url, { validateStatus: () => true });
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
        return [];
    }
}

async function fetchJSearchJobs(companyName) {
    if (!process.env.RAPIDAPI_KEY) {
        console.warn(`Skipping JSearch for ${companyName} because RAPIDAPI_KEY is not set.`);
        return [];
    }

    try {
        const options = {
            method: 'GET',
            url: 'https://jsearch.p.rapidapi.com/search',
            params: {
                query: `software engineer at ${companyName} in India`,
                page: '1',
                num_pages: '1',
                date_posted: 'today' // Only fetch very recent jobs to save data processing
            },
            headers: {
                'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        };

        const response = await axios.request(options);
        const jobs = response.data.data || [];
        return jobs
            .filter(job => isRelevantJob(job.job_title))
            .map(job => ({
                id: `js_${job.job_id}`,
                title: job.job_title,
                company: companyName,
                location: job.job_city || job.job_country,
                url: job.job_apply_link,
                ats: 'jsearch_fallback'
            }));
    } catch (error) {
        console.error(`JSearch error for ${companyName}:`, error.message);
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
        } else {
            // Fallback for unknown or unhandled ATS (like Workday)
            jobs = await fetchJSearchJobs(company.name);
        }
        
        allJobs = allJobs.concat(jobs);
    }
    
    return allJobs;
}

module.exports = { fetchAllJobs };
