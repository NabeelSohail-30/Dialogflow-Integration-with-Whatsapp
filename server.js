const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios");
const uuid = require('uuid');
require('dotenv').config();

const app = express().use(body_parser.json());

app.get('/', (req, res) => {
    res.sendStatus(200);
});

app.get('/ping', (req, res) => {
    res.send('ping back');
});

const token = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;
const dialogflowProjectId = process.env.DIALOGFLOW_PROJECT_ID;
const dialogflowSessionId = uuid.v4();
const dialogflowSessionClient = require('dialogflow').SessionsClient;

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook", (req, res) => {
    let mode = req.query["hub.mode"];
    let challange = req.query["hub.challenge"];
    let token = req.query["hub.verify_token"];

    if (mode && token) {
        if (mode === "subscribe" && token === mytoken) {
            res.status(200).send(challange);
        } else {
            res.status(403);
        }
    }
});

// Dialogflow fulfillment webhook
app.post('/dialogflow-fulfillment', async (req, res) => {
    const text = req.body.queryResult.queryText;
    const intent = req.body.queryResult.intent.displayName;

    console.log(`Received Dialogflow fulfillment request for intent '${intent}' and text '${text}'`);

    if (intent === 'Default Welcome Intent') {
        // Respond to welcome intent
        const responseText = 'Hello! How can I assist you today?';
        res.json({ fulfillmentText: responseText });
    } else if (intent === 'about') {
        // Respond to about intent
        const responseText = 'I am a webhook integrated with Dialogflow.';
        res.json({ fulfillmentText: responseText });
    } else {
        // Unrecognized intent
        res.json({ fulfillmentText: "I'm sorry, I don't understand." });
    }
});

app.post("/webhook", (req, res) => {

    let body_param = req.body;

    console.log(JSON.stringify(body_param, null, 2));

    if (body_param.object) {
        console.log("inside body param");
        if (body_param.entry &&
            body_param.entry[0].changes &&
            body_param.entry[0].changes[0].value.messages &&
            body_param.entry[0].changes[0].value.messages[0]) {

            let phon_no_id = body_param.entry[0].changes[0].value.metadata.phone_number_id;
            let from = body_param.entry[0].changes[0].value.messages[0].from;
            let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;

            console.log("phone number " + phon_no_id);
            console.log("from " + from);
            console.log("boady param " + msg_body);

            // Send message to Dialogflow
            const sessionClient = new dialogflowSessionClient();
            const sessionPath = sessionClient.sessionPath(dialogflowProjectId, dialogflowSessionId);

            const request = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: msg_body,
                        languageCode: 'en-US',
                    },
                },
            };

            sessionClient.detectIntent(request).then((responses) => {
                const result = responses[0].queryResult;
                console.log(`Received Dialogflow response for query '${result.queryText}'`);
                console.log(`Response: ${result.fulfillmentText}`);

                // Send response back to WhatsApp
                axios({
                    method:
                        "POST",
                    url: "https://graph.facebook.com/v13.0/" + phon_no_id + "/messages?access_token=" + token,
                    data: {
                        messaging_product: "whatsapp",
                        to: from,
                        text: {
                            body: result.fulfillmentText // Send Dialogflow fulfillment text as WhatsApp message body
                        }
                    },
                    headers: {
                        "Content-Type": "application/json"
                    }
                }); res.sendStatus(200);
            })
                .catch((err) => {
                    console.error("Error occurred while sending message to Dialogflow", err);
                    res.sendStatus(500);
                });
        } else {
            res.sendStatus(404);
        }
    }
    else {
        res.sendStatus(404);
    }
});

// Start server
const port = process.env.PORT || 5005;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});