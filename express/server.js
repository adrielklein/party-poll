const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const axios = require('axios');
const { createEventAdapter } = require("@slack/events-api");

const { WebClient } = require("@slack/web-api");

const app = express();
const slackSigningSecret ="918e4bbd0c0af46ac9163f4a1e413ad3";

const slackEvents = createEventAdapter(slackSigningSecret);

const botToken = process.env.SLACK_BOT_TOKEN;

console.log({ slackSigningSecret, botToken });
// Create a new instance of the WebClient class with the token read from your environment variable
// this will later get changed during redirect (hopefully)
// const web = new WebClient(process.env.SLACK_TOKEN);
let web;

const router = express.Router();

router.get("/", (req, res) => {
  console.log("hello get", { req });
  res.json({ username: "Flavio" });
});

router.get("/auth/redirect", (req, res) => {
  console.log("redirect", { req, res });
  console.log({ env: process.env });
  console.log('making call to oauth.v2.access with',{
    params: {
      code: req.query.code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    },
  } )

  axios.get("https://slack.com/api/oauth.v2.access", {
    params: {
      code: req.query.code,
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
    },
  }).then(function (response) {
    console.log('response.data', response.data)
    console.log('got respose back from /auth.v2.access', response)
    console.log('setting up WebClient with this token', response.data.access_token)
    web = new WebClient(response.data.access_token)
    res.send('App installed successfully!')
  })
  .catch(function (error) {
    console.log("error hitting /oauth.v2.access",error);
  })
});

router.get("/another", (req, res) => res.json({ route: req.originalUrl }));

router.post("/", async (req, res) => {
  console.log("posting!!!");
  const { body } = req;
  console.log({ body });
  const { channel_id, text } = body;
  console.log({ channel_id, text });
  await createPoll(channel_id, text);
  console.log("ending");
  res.end();
  console.log("ended");
});

app.use("/slack/events", slackEvents.requestListener());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use(express.static("public"));
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));

module.exports = app;
module.exports.handler = serverless(app);

const reactionNames = [
  "tada",
  "balloon",
  "confetti_ball",
  "partying_face",
  "birthday",
  "gift",
  "cupcake",
  "laughing",
  "pinata",
  "kissing_heart",
];

const helpTextLines = [
  'Start poll via slash command such as `/partypoll "What is the best color?" "red" "blue" "green"`',
  "Watch as a poll is automatically created for you :tada:",
  "Don't want to start a poll about colors? Use whatever values you want :confetti_ball:",
  "Time to party :partying_face:",
];

const sendHelp = (channelId) => {
  console.log("sending help", { channelId });
  return web.chat.postMessage({
    channel: channelId,
    response_type: "ephemeral",
    text: "Hello friend :wave: Welcome to party poll :balloon:",
    attachments: [
      {
        text: helpTextLines.join("\n"),
      },
    ],
  });
};

const sendError = (channelId) => {
  console.log("sending error", { channelId });
  return web.chat.postMessage({
    channel: channelId,
    response_type: "ephemeral",
    text: "Sorry friend :cry:",
    attachments: [
      {
        text:
          "Max number of options is 10\nPlease try again with fewer options",
      },
    ],
  });
};

const createPoll = async (channelId, text) => {
  // try {
  //   const conversationsResponse = await web.conversations.join({
  //     channel: channelId,
  //   });
  //   console.log("just joined channel", { conversationsResponse });
  // } catch (error) {
  //   console.log("error joining channel", { error });
  // }
  console.log("createPoll", { text });
  if (text === "help" || text === "") {
    return sendHelp(channelId);
  }
  const values = text.replace(/\“|\”|\〝|\〞/g, "\"") // Convert irregular quotes to regular ones
    .match(/\w+|"[^"]+"/g)
    .map((value) => value.replace(/\"|\'|\“|\”|\”|\〝|\〞/g, ""));
  console.log({ values });
  const options = values.length === 1 ? ["yes", "no"] : values.splice(1);
  if (options.length > 10) {
    return sendError(channelId);
  }
  console.log({ options });

  formattedOptions = options.map(
    (option, i) => `:${reactionNames[i]}: ${option}`
  );

  try {
    console.log("about to post");
    const { channel, message } = await web.chat.postMessage({
      channel: channelId,
      blocks: [
        { type: "header", text: { type: "plain_text", text: values[0] } },
        {
          type: "section",
          text: { type: "mrkdwn", text: formattedOptions.join("\n") },
        },
      ],
    });
    console.log("posted", { channel, message });
    const { ts } = message;
    for (let i = 0; i < options.length; i++) {
      await web.reactions.add({
        channel,
        name: reactionNames[i],
        timestamp: ts,
      });
    }
  } catch (error) {
    console.log({ error });
  }

  console.log("Message posted!");
};
