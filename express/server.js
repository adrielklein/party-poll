const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const bodyParser = require("body-parser");
const app = express();
const { createEventAdapter } = require("@slack/events-api");

const { WebClient } = require("@slack/web-api");
const { Console } = require("console");

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

console.log({ slackSigningSecret });

const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
console.log({ slackEvents });

const botToken = process.env.SLACK_BOT_TOKEN;
// Create a new instance of the WebClient class with the token read from your environment variable
// const web = new WebClient(process.env.SLACK_TOKEN);
console.log({ botToken });
const web = new WebClient(botToken);

const router = express.Router();

router.get("/", (req, res) => {
  console.log("hello get", { req });
  res.json({ username: "Flavio" });
});

router.get("/another", (req, res) => res.json({ route: req.originalUrl }));

router.post("/", (req, res) => {
  console.log("posting!!!");
  console.log({ slackToken: process.env.SLACK_TOKEN });
  const { body } = req;
  console.log({ body });
  const { channel_id, text } = body;
  console.log({ channel_id, text });
  postStuff(channel_id, text);
  console.log("ending");
  res.end();
  console.log("ended");
});

app.use("/slack/events", slackEvents.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));

module.exports = app;
module.exports.handler = serverless(app);

const reactionNames = [
  "green_heart",
  "yellow_heart",
  "blue_heart",
  "purple_heart",
  "orange_heart",
  "heart",
];

// const reactionNames = [
//   "party-blob",
//   "bootleg_parrot",
//   "cool-doge",
//   "mario_luigi_dance",
//   "party_face",
//   "tada",
//   "confetti_ball",
//   "aaw_yeah",
// ];

const postStuff = async (channelId, text) => {
  console.log("postStuff");
  const values = text
    .match(/\w+|"[^"]+"/g)
    .map((value) => value.replace(/\"|\'/g, ""));
  console.log({ values });
  const options = values.splice(1);
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
