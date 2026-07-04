require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const PORT = 3000;

// You need to set these in your .env file
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `http://localhost:${PORT}/oauth2callback`
);

const SCOPES = ['https://www.googleapis.com/auth/tasks'];

async function authenticate() {
    return new Promise((resolve, reject) => {
        const authorizeUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent' // Forces it to return a refresh token
        });

        const server = http.createServer(async (req, res) => {
            try {
                if (req.url.indexOf('/oauth2callback') > -1) {
                    const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
                    res.end('Authentication successful! Please return to the console.');
                    server.destroy();
                    const { tokens } = await oAuth2Client.getToken(qs.get('code'));
                    oAuth2Client.credentials = tokens;
                    resolve(tokens);
                }
            } catch (e) {
                reject(e);
            }
        });

        // Use destroy helper to forcefully close connections
        const connections = {};
        server.on('connection', (conn) => {
            const key = conn.remoteAddress + ':' + conn.remotePort;
            connections[key] = conn;
            conn.on('close', () => { delete connections[key]; });
        });
        server.destroy = () => {
            server.close();
            for (const key in connections) connections[key].destroy();
        };

        server.listen(PORT, () => {
            console.log(`\n1. Open this URL in your browser:\n\n${authorizeUrl}\n`);
            console.log(`2. Log in and authorize the application.`);
            console.log(`3. Waiting for callback...\n`);
        });
    });
}

async function run() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error('Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file first.');
        process.exit(1);
    }
    
    try {
        const tokens = await authenticate();
        console.log('--- SUCCESS ---');
        console.log('Add the following line to your .env and GitHub Secrets:');
        console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
        console.log('---------------');
    } catch (e) {
        console.error('Error during authentication:', e);
    }
}

run();
