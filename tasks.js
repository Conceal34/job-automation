const { google } = require('googleapis');

function getAuthClient() {
    const oAuth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
    );
    oAuth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });
    return oAuth2Client;
}

async function addJobsToTasks(newJobs) {
    if (newJobs.length === 0) return;

    const auth = getAuthClient();
    const service = google.tasks({ version: 'v1', auth });

    // Assuming we use the primary default task list
    const tasklistId = '@default'; 

    for (const job of newJobs) {
        try {
            await service.tasks.insert({
                tasklist: tasklistId,
                requestBody: {
                    title: `Apply: ${job.company} - ${job.title}`,
                    notes: `Link: ${job.url}\nLocation: ${job.location}`,
                    // Optionally set a due date (e.g., 3 days from now)
                    due: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
                }
            });
            console.log(`Added task for ${job.company}`);
        } catch (error) {
            console.error(`Failed to add task for ${job.company}:`, error.message);
        }
    }
}

module.exports = { addJobsToTasks };
