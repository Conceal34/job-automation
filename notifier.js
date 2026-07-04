const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmailNotification(newJobs) {
    if (newJobs.length === 0) return;

    let htmlContent = `<h2>New Job Postings Alert</h2><ul>`;
    newJobs.forEach(job => {
        htmlContent += `<li><strong>${job.company}</strong>: <a href="${job.url}">${job.title}</a> (${job.location})</li>`;
    });
    htmlContent += `</ul><p>These jobs have also been added to your Google Tasks.</p>`;

    try {
        await resend.emails.send({
            from: 'JobBot <onboarding@resend.dev>', // Default resend testing domain
            to: process.env.NOTIFICATION_EMAIL,
            subject: `🚀 ${newJobs.length} New Job(s) Found!`,
            html: htmlContent
        });
        console.log('Email notification sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
}

module.exports = { sendEmailNotification };
