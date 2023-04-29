const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const openai = require('openai');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/ping', (req, res) => {
    res.send('ping back');
});

const port = process.env.PORT || 5001;

// Set up the OpenAI API credentials
const openaiApiKey = procees.env.API_KEY;
const openaiApi = new openai.Auth({ api_key: openaiApiKey });

// Set up the Dialogflow client
const dialogflowProjectId = 'YOUR_DIALOGFLOW_PROJECT_ID';
const dialogflowSessionId = 'YOUR_DIALOGFLOW_SESSION_ID';
const dialogflowLanguageCode = 'en-US';
const dialogflowClient = new dialogflow.SessionsClient();
const dialogflowSessionPath = dialogflowClient.sessionPath(dialogflowProjectId, dialogflowSessionId);

// Handle incoming messages from Dialogflow
app.post('/webhook', async (req, res) => {
    const message = req.body.queryResult.queryText;

    // Send the message to OpenAI
    const openaiResponse = await openaiApi.completions.create({
        engine: 'davinci',
        prompt: message,
        max_tokens: 100,
        n: 1,
        stop: '\n',
    });

    const response = openaiResponse.data.choices[0].text.trim();

    // Send the OpenAI response back to Dialogflow
    const dialogflowRequest = {
        session: dialogflowSessionPath,
        queryInput: {
            text: {
                text: response,
                languageCode: dialogflowLanguageCode,
            },
        },
    };

    const dialogflowResponse = await dialogflowClient.detectIntent(dialogflowRequest);

    res.json(dialogflowResponse[0].queryResult);
});

// Start the server
app.listen(port, () => {
    console.log('Server started on port 3000');
});
