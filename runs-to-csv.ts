import express, { Request, Response } from 'express';
import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';
import { createObjectCsvWriter } from 'csv-writer'; // Import csv-writer
import { secondsToHMS, formatDate, convertSpeedToPace, truncateName } from './utils';

dotenv.config();

const app = express();
const port = 3000;

const clientId = process.env.STRAVA_CLIENT_ID;
const clientSecret = process.env.STRAVA_CLIENT_SECRET;
const redirectUri = process.env.STRAVA_REDIRECT_URI

// Global variable to store all runs
let allRuns: any[] = [];

// CSV writer setup
const csvWriter = createObjectCsvWriter({
    path: 'strava_runs.csv', // Output CSV file path
    header: [
        { id: 'index', title: 'No.' },
        { id: 'name', title: 'Name' },
        { id: 'distance', title: 'Distance (KM)' },
        { id: 'pace', title: 'Pace' },
        { id: 'time', title: 'Time' },
        { id: 'kudos', title: 'Kudos' },
        { id: 'date', title: 'Date' },
        { id: 'link', title: 'Link' },     
    ],
});

// 1 - Redirect to Strava authorization URL (having scope=activity:read_all is very important)
app.get('/auth', (req: Request, res: Response) => {
    const authURL = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=activity:read_all`;
    res.redirect(authURL);
})

// 2 - Exchange authorization code for access token
app.get('/', async ( req: Request, res: Response) => {
    const { code } = req.query;

    if(!code){
        return res.status(400).send('Authorization code is missing.')
    }

    try {
        const tokenResponse = await axios.post(
            'https://www.strava.com/oauth/token', 
            qs.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code'
            }),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    );

    const { access_token } = tokenResponse.data;

    // 3 - Redirect to a confiramtion tab
    res.redirect('/confirmation');

    // 4 - Fetch strava runs
    const perPage = 100;
    let page = 1;
    let allActivities: any[] = []; // Temporary array to store all activities

    while(true){
        console.log('Fetching your runs, please wait a few moments ... ')
        const activitiesResponse = await axios.get(
            'https://www.strava.com/api/v3/athlete/activities',
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                },
                params: {
                    per_page: perPage, // Number of activities to fetch per page (100 is the max)
                    page: page, // Page number to fetch 
                } 
            }
        );
        const activities = activitiesResponse.data;
        if(activities.length === 0){
            break; // Exit the loop if there are no more activities to fetch
        }

        allActivities = allActivities.concat(activities); // Append fetched activities
        page++; // Move to the next page
    }

    // Filter to only running activities (You can change this to whatever activity you like)
    allRuns = allActivities.filter((activity: any) => activity.type === 'Run');

    if(allRuns.length > 0){
        // Write runs to a CSV file
        await csvWriter.writeRecords(
            allRuns.map((run, index) => ({
                index: index + 1,
                name: truncateName(run.name),
                distance: (run.distance / 1000).toFixed(2),
                pace: convertSpeedToPace(run.average_speed),
                time: secondsToHMS(run.moving_time),
                kudos: run.kudos_count,
                date: formatDate(run.start_date),
                link: `https://www.strava.com/activities/${run.id}`,
            }))
        );
        console.log('Your runs have been written to strava_runs.csv')
    } else {
        console.log('No runs to write to CSV.');
    }
    } catch (error){
        console.log('Error exchanging token or fetching activities: ', error);
        res.status(500).send('Failed to fetch activities.')
    }
})

app.get('/confirmation', (req: Request, res: Response) => {
    res.send(`
    <html>
      <body>
        <h1>Authorization Complete</h1>
        <p>You may close this tab and return to your code editor.</p>
      </body>
    </html>
  `)
})

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
    console.log(`Please visit this URL to authorize the application with Strava:\nhttp://localhost:${port}/auth`)
})