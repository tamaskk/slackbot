import { google } from 'googleapis';

// Your Google API credentials
const GOOGLE_API_CREDENTIALS = {
  client_email: "kalman.tamaskrisztian@gmail.com",
  private_key: "AIzaSyDRVtiBOUbhQjRnZveK7xUzeWRDp8FZhEw"
};
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// Function to create a Google Meet link
async function createGoogleMeet() {
//   const auth = new google.auth.JWT(
//     GOOGLE_API_CREDENTIALS.client_email,
//     null,
//     GOOGLE_API_CREDENTIALS.private_key,
//     SCOPES
//   );

const auth = new google.auth.JWT(
    GOOGLE_API_CREDENTIALS.client_email,
    undefined,
    GOOGLE_API_CREDENTIALS.private_key,
    SCOPES
)

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
    conferenceDataVersion: 1,
  })
//   calendar.events.insert({
//     calendarId: 'primary',
//     resource: event,
//     conferenceDataVersion: 1,
//   });

  return response.data.hangoutLink;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'POST') {
    const { text, user_name } = req.body;

    try {
      const meetLink = await createGoogleMeet();

      res.status(200).json({
        response_type: 'in_channel', // Visible to everyone in the channel
        text: `@${user_name} created a Google Meet link: ${meetLink}`,
      });
    } catch (error) {
      console.error('Error creating Google Meet:', error);
      res.status(500).json({
        response_type: 'ephemeral', // Only visible to the user
        text: 'An error occurred while creating the Google Meet link.',
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
