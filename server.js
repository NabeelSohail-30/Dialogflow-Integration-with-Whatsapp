const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 5005;
const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
const dialogflowProjectId = process.env.DIALOGFLOW_PROJECT_ID;

const sessionClient = new dialogflow.SessionsClient();

app.use(bodyParser.json());

// Dialogflow fulfillment webhook
app.post('/dialogflow-fulfillment', async (req, res) => {
    const intent = req.body.queryResult.intent.displayName;

    switch (intent) {
        case 'Default Welcome Intent':
            {
                res.send({
                    fulfillmentMessages: [
                        {
                            text: {
                                text: ['Welcome to the WhatsApp bot! Integrated with dialogflow'],
                            },
                        },
                    ],
                });
                break;
            }

        case 'About': {
            res.send({
                fulfillmentMessages: [
                    {
                        text: {
                            text: ['This is a WhatsApp bot created using Dialogflow and Node.js.'],
                        },
                    },
                ],
            });
            break;
        }

        default: {
            res.send({
                fulfillmentMessages: [
                    {
                        text: {
                            text: ['Sorry, I don\'t understand.'],
                        },
                    },
                ],
            });
        }
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});