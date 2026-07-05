# 🚀 Automated Job Hunt Scraper

An intelligent, fully automated job hunting bot designed for Software Engineering Freshers. It scans hundreds of career portals and APIs every 6 hours, filters for specific fresher-level tech roles in India/Remote, sends you email alerts, and automatically schedules "Apply" tasks in Google Tasks!

## 🧠 How it Works
1. **GitHub Actions (Cron Job)**: Wakes up every 6 hours automatically (24/7, for free).
2. **Hybrid Fetching**:
    * **Direct API**: Hits Greenhouse & Lever public JSON APIs for instant results.
    * **Headless Puppeteer**: Spawns a Chromium browser to physically scrape custom portals (Unstop, Talent500, Cutshort, HackerEarth, etc.).
    * **RapidAPI JSearch Fallback**: Queries a universal job API for companies using custom/unsupported ATS systems like Workday.
3. **Smart Filtering**: Uses strict Regex to only capture Software Engineer, SDE, SRE, and Intern roles, while aggressively filtering out Senior, L4+, Mid-level, Sales, and non-tech roles.
4. **State Management (`seen_jobs.json`)**: Automatically commits its memory back to the repository so you **never** receive duplicate alerts for the same job.

## 🛠️ Setup Instructions

### 1. Google Tasks Setup
1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Google Tasks API**.
3. Create **OAuth Client ID** credentials (choose "Desktop app").
4. Add the `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to your `.env` file.
5. Run `node get_credentials.js` in your terminal to get the `GOOGLE_REFRESH_TOKEN`.

### 2. Resend Email Setup
1. Go to [Resend.com](https://resend.com) and create an account.
2. Generate an API key. This gives you 3,000 free emails per month.
3. Save it to your `.env` as `RESEND_API_KEY`.

### 3. RapidAPI Fallback Setup
1. Go to [JSearch on RapidAPI](https://rapidapi.com/search/JSearch).
2. Subscribe to the Basic (Free) tier (50 requests/month).
3. Grab the `X-RapidAPI-Key` from the Endpoints tab.
4. Save it to your `.env` as `RAPIDAPI_KEY`.

## ☁️ Deployment (GitHub Actions)
To run this automatically in the cloud:
1. Push this code to a **private** GitHub repository.
2. Go to **Settings > Secrets and variables > Actions** and add these repository secrets:
   * `RESEND_API_KEY`
   * `NOTIFICATION_EMAIL` (Your email address)
   * `GOOGLE_CLIENT_ID`
   * `GOOGLE_CLIENT_SECRET`
   * `GOOGLE_REFRESH_TOKEN`
   * `RAPIDAPI_KEY`
3. Go to **Settings > Actions > General > Workflow permissions** and select **Read and write permissions** (Required to save the `seen_jobs.json` file).
4. Go to the **Actions** tab and trigger the workflow manually for the first run!

## 📝 Modifying Target Companies
To add or remove target companies, simply edit the `companies.json` file.
* If you know they use Greenhouse or Lever, add `"ats": "greenhouse"` (or lever) and provide the `"boardToken"`.
* If you don't know, leave `"ats": "unknown"` and the RapidAPI fallback will handle it automatically!
