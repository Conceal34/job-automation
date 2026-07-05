# 🚀 Job Scraper Automation (Fresher SDE Edition)

A fully autonomous, self-scheduling job hunting machine built specifically for entry-level Software Engineering (SDE/SWE) roles in India and remote environments. 

This bot runs 24/7 on GitHub Actions, scrapes hundreds of companies and platforms, strictly filters out irrelevant roles, alerts you via email, and directly inserts applications into your Google Tasks to-do list.

---

## 🏗️ Architecture & Features

### 1. The Hybrid Scraper Engine
To maximize coverage without breaking rate limits, the bot uses three distinct scraping methods:
* **Direct ATS APIs:** Instantly fetches live jobs from companies using **Greenhouse** and **Lever** using their public, unauthenticated JSON endpoints.
* **RapidAPI JSearch Fallback:** For companies using custom portals or heavy enterprise ATS systems (like Workday), it falls back to a universal job aggregator API to find their listings.
* **Headless Puppeteer Scrapers:** Physically boots up a headless Chromium browser to navigate and scrape web portals that don't have public APIs, including:
  * **Unstop**
  * **Talent500**
  * **Cutshort**
  * **HackerEarth**
  * **Lets-Code**
  * Custom heuristic scraping for the top 50 priority companies on your target list.

### 2. Sniper-Level Smart Filtering
You will not receive spam. The bot uses strict Regular Expressions to ensure roles perfectly match your profile:
* **Role Inclusions:** Must exactly match words like `swe`, `sde`, `sre`, `software`, `intern`, `fresher`, `developer`, `engineer`, `frontend`, `backend`, or `fullstack`.
* **Aggressive Exclusions (Roles):** Instantly drops anything containing `sales`, `marketing`, `hr`, `finance`, `executive`, `trainee`, or `support`.
* **Aggressive Exclusions (Experience):** Explicitly filters out mid-level and senior roles by looking for markers like `senior`, `staff`, `lead`, `manager`, `principal`, `director`, `vp`, `ii`, `iii`, `iv`, `v`, `l3`, `l4`, `l5`, `l6`, `mid`, `mid-level`, and `experienced`.
* **Location Filtering:** Strictly requires the location to match `India`, `Remote`, `Bengaluru`, `Mumbai`, `Pune`, `Hyderabad`, `Gurugram`, `Noida`, `Delhi`, `Chennai`, or `Anywhere`.

### 3. Persistent Memory (Git Scraping)
Because GitHub Actions resets the server after every run, the bot maintains a `seen_jobs.json` file. After it runs, it commits this file back to the repository. This guarantees you will **never be notified about the same job twice**.

---

## 🏢 Target Companies
This repository is pre-loaded with a `companies.json` file containing **350 target companies** heavily curated for your profile (combining mid-market product companies, startups, and specific IT services). 

* **To add a company:** Open `companies.json` and add a new JSON object. 
* If you know they use Greenhouse or Lever, set `"ats": "greenhouse"` or `"ats": "lever"` and provide their URL token in `"boardToken"`.
* If you don't know their ATS, set `"ats": "unknown"`. The bot will automatically use the JSearch fallback API for them!

---

## 🛠️ Step-by-Step Setup Guide

To get this running on your own GitHub account, you need to set up three free services.

### Phase 1: Google Tasks Authentication
The bot needs permission to add tasks to your personal Google account.
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the top-left dropdown and click **New Project**. Name it "JobBot".
3. Search for **Google Tasks API** in the top search bar and click **Enable**.
4. Go to **APIs & Services > OAuth consent screen**. Choose **External**, fill in the required names, and add your own Gmail address under "Test users".
5. Go to **Credentials**, click **Create Credentials**, and select **OAuth client ID**. Choose **Desktop app**.
6. Copy the `Client ID` and `Client Secret`.
7. On your local computer, create a `.env` file in this folder and add:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```
8. Run `node get_credentials.js` in your terminal. It will give you a link. Click it, log in with your Google account, and copy the `Refresh Token` it prints in the terminal.

### Phase 2: Resend Email Setup
This prevents your emails from going to spam and avoids Google blocking automated logins.
1. Go to [Resend.com](https://resend.com) and log in with GitHub.
2. Click **API Keys** on the left sidebar.
3. Click **Create API Key**, name it "JobBot", and click Add.
4. **Copy the key immediately** (it starts with `re_...`).

### Phase 3: RapidAPI JSearch (The Fallback Engine)
1. Go to the [JSearch API on RapidAPI](https://rapidapi.com/letscrape-6bRBa3QG1q/api/jsearch).
2. Log in with GitHub or Google.
3. Click the **Pricing** tab and subscribe to the **Basic (Free)** tier.
4. Click the **Endpoints** tab. On the right side, under "Header Parameters", copy the long string next to `X-RapidAPI-Key`.

### Phase 4: GitHub Deployment
1. Push this code to a **private** GitHub repository.
2. Go to the repository on GitHub, click **Settings > Secrets and variables > Actions**.
3. Click **New repository secret** and add the following exactly:
   * `RESEND_API_KEY`: (Your Resend Key)
   * `NOTIFICATION_EMAIL`: (Your personal Gmail address where you want to receive alerts)
   * `GOOGLE_CLIENT_ID`: (From Phase 1)
   * `GOOGLE_CLIENT_SECRET`: (From Phase 1)
   * `GOOGLE_REFRESH_TOKEN`: (From Phase 1)
   * `RAPIDAPI_KEY`: (From Phase 3)
4. On the left sidebar of Settings, click **Actions > General**. Scroll down to **Workflow permissions** and select **Read and write permissions**. (If you don't do this, the bot cannot save its memory!).

### Phase 5: Liftoff! 🚀
1. Click the **Actions** tab at the top of your GitHub repository.
2. Click **Job Scraper Automation** on the left.
3. Click **Run workflow** on the right side.

From now on, it will automatically run every 6 hours silently in the background!

---

## 💻 Local Testing
If you ever want to test the bot manually on your computer:
1. Ensure your `.env` file has all the keys from the GitHub secrets.
2. Run `npm install` (if you haven't already).
3. Run `node index.js`.
4. Watch the terminal output as it scrapes the web!
