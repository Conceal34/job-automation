const axios = require('axios');

const ROLE_REGEX = /\b(swe|sde|sre|software|intern|fresher|developer|engineer|frontend|backend|fullstack)\b/i;
const EXCLUDE_REGEX = /\b(senior|staff|lead|manager|principal|director|vp|sales|marketing|hr|finance|executive|trainee|support|ii|iii|iv|v|l3|l4|l5|l6|mid|mid-level|experienced)\b/i;
const LOCATION_KEYWORDS = ['india', 'remote', 'bengaluru', 'bangalore', 'mumbai', 'pune', 'hyderabad', 'gurugram', 'gurgaon', 'noida', 'delhi', 'chennai', 'anywhere'];

function isRelevantJob(title, location) {
    if (!title) return false;
    const hasRole = ROLE_REGEX.test(title);
    const isExcluded = EXCLUDE_REGEX.test(title);
    
    // Check location
    let isGoodLocation = true;
    if (location) {
        const lowerLoc = location.toLowerCase();
        isGoodLocation = LOCATION_KEYWORDS.some(kw => lowerLoc.includes(kw));
    }

    return hasRole && !isExcluded && isGoodLocation;
}

async function fetchGreenhouseJobs(boardToken) {
    try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs`;
        const response = await axios.get(url, { validateStatus: () => true });
        const jobs = response.data.jobs || [];
        return jobs
            .filter(job => isRelevantJob(job.title, job.location?.name))
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
            .filter(job => isRelevantJob(job.text, job.categories?.location))
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
            },
            validateStatus: () => true
        };

        const response = await axios.request(options);
        if (response.status !== 200) return [];
        const jobs = response.data.data || [];
        return jobs
            .filter(job => isRelevantJob(job.job_title, job.job_city || job.job_country))
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
