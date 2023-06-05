const express = require('express');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();
const app = express();
const port = process.env.PORT || 5005;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configure Twilio credentials
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const myTwilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const twilioClient = twilio(accountSid, authToken);

// Dialogflow fulfillment webhook
app.post('/dialogflow-fulfillment', async (req, res) => {
    const intent = req.body.queryResult.intent.displayName;
    const phoneNumber = req.body.originalDetectIntentRequest.payload.data.From;

    switch (intent) {
        case 'Default Welcome Intent':
            {
                sendMessage(phoneNumber, 'Welcome to the WhatsApp bot! Integrated with Dialogflow');
                break;
            }

        case 'About':
            {
                sendMessage(phoneNumber, 'This is a WhatsApp bot created using Dialogflow and Node.js.');
                break;
            }

        default:
            {
                sendMessage(phoneNumber, "Sorry, I don't understand.");
            }
    }

    res.status(200).end();
});

// Function to send a WhatsApp message using Twilio
function sendMessage(to, message) {
    twilioClient.messages
        .create({
            body: message,
            from: myTwilioPhoneNumber,
            to: to
        })
        .then(message => console.log(`Sent message: ${message.sid}`))
        .catch(error => console.error(`Error sending message: ${error.message}`));
}

// Twilio webhook to receive incoming messages from WhatsApp
app.post('/whatsapp', async (req, res) => {
    const messageBody = req.body.Body;
    const from = req.body.From;

    console.log(messageBody);
    console.log(from);
    console.log(myTwilioPhoneNumber);

    // Pass the incoming message to Dialogflow for processing
    // and handle the response in the '/dialogflow-fulfillment' route
    // by sending the user's phone number along with the request

    const sessionClient = new SessionsClient();
    const projectId = process.env.DIALOGFLOW_PROJECT_ID;
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, from);
    const languageCode = 'en-US';

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: messageBody,
                languageCode: languageCode,
            },
        },
    };

    sessionClient.detectIntent(request)
        .then(responses => {
            const fulfillmentText = responses[0].queryResult.fulfillmentText;
            sendMessage(from, fulfillmentText);
        })
        .catch(error => {
            console.error(`Error sending message: ${error.message}`);
        });

    res.status(200).end();
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
