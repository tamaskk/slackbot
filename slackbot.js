// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const axios = require('axios');

// Create an Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Your Google API credentials
const GOOGLE_API_CREDENTIALS = {
  client_email: 'your-client-email@developer.gserviceaccount.com',
  private_key: 'AIzaSyDRVtiBOUbhQjRnZveK7xUzeWRDp8FZhEw',
};
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Function to create a Google Meet link
async function createGoogleMeet() {
  const auth = new google.auth.JWT(
    GOOGLE_API_CREDENTIALS.client_email,
    null,
    GOOGLE_API_CREDENTIALS.private_key,
    SCOPES
  );

  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary: 'Slack Bot Meeting',
    start: {
      dateTime: new Date().toISOString(),
      timeZone: 'UTC',
    },
    end: {
      dateTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes later
      timeZone: 'UTC',
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
  });

  return response.data.hangoutLink;
}

// Endpoint for the Slack slash command
app.post('/meet', async (req, res) => {
  const { text, user_name } = req.body;

  try {
    const meetLink = await createGoogleMeet();

    return res.json({
      response_type: 'in_channel', // Visible to everyone in the channel
      text: `@${user_name} created a Google Meet link: ${meetLink}`,
    });
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    return res.json({
      response_type: 'ephemeral', // Only visible to the user
      text: 'An error occurred while creating the Google Meet link.',
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Slack bot is running on port ${PORT}`);
});
