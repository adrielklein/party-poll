"use strict";
const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const app = express();
const bodyParser = require("body-parser");

const router = express.Router();
router.get("/", (req, res) => {
  console.log("get");
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write("<h1>Hello from Express.js!</h1>");
  res.end();
});
router.get("/another", (req, res) => res.json({ route: req.originalUrl }));
router.post("/", (req, res) => {
  console.log("post");
  return res.json({ postBody: req.body });
});

app.use(bodyParser.json());
app.use("/.netlify/functions/server", router); // path must route to lambda
app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));

module.exports = app;
module.exports.handler = serverless(app);

// const express = require("express");
// const path = require("path");
// const serverless = require("serverless-http");
// const bodyParser = require("body-parser");
// const app = express();

// const { WebClient } = require("@slack/web-api");
// // Create a new instance of the WebClient class with the token read from your environment variable
// const web = new WebClient(process.env.SLACK_TOKEN);

// const router = express.Router();

// router.get("/", (req, res) => {
//   console.log("hello get", { req });
//   res.json({ username: "Flavio" });
// });

// router.get("/another", (req, res) => res.json({ route: req.originalUrl }));

// router.post("/", (req, res) => {
//   console.log("hello post", { req });
//   const { channel_id, text } = req.body;
//   console.log({ channel_id, text });
//   postStuff(channel_id, text);
//   res.end();
// });

// app.use(bodyParser.json());
// // app.use("/", (req, res) => res.sendFile(path.join(__dirname, "../index.html")));
// app.use("/.netlify/functions/server", router); // path must route to lambda

// module.exports = app;
// module.exports.handler = serverless(app);

// const reactionNames = [
//   "green_heart",
//   "yellow_heart",
//   "blue_heart",
//   "purple_heart",
//   "orange_heart",
//   "heart",
// ];

// // const reactionNames = [
// //   "party-blob",
// //   "bootleg_parrot",
// //   "cool-doge",
// //   "mario_luigi_dance",
// //   "party_face",
// //   "tada",
// //   "confetti_ball",
// //   "aaw_yeah",
// // ];

// const postStuff = async (channelId, text) => {
//   const values = text
//     .match(/\w+|"[^"]+"/g)
//     .map((value) => value.replace(/\"|\'/g, ""));
//   const options = values.splice(1);

//   formattedOptions = options.map(
//     (option, i) => `:${reactionNames[i]}: ${option}`
//   );

//   try {
//     const { channel, message } = await web.chat.postMessage({
//       channel: channelId,
//       blocks: [
//         { type: "header", text: { type: "plain_text", text: values[0] } },
//         {
//           type: "section",
//           text: { type: "mrkdwn", text: formattedOptions.join("\n") },
//         },
//       ],
//     });
//     const { ts } = message;
//     for (let i = 0; i < options.length; i++) {
//       await web.reactions.add({
//         channel,
//         name: reactionNames[i],
//         timestamp: ts,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//   }

//   console.log("Message posted!");
// };
