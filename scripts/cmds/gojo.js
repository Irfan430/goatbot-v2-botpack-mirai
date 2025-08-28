const axios = require("axios");
const { GoatWrapper } = require("fca-liane-utils");

const GEMINI_API_KEY = "AIzaSyDbXYdHBeMfehplNK_ELcMFbVDMIxTRE5k";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

module.exports.config = {
  name: "gojo",
  version: "3.0.1",
  role: 0,
  author: "Ew'r Saim",
  description: "Talk with Gojo Satoru in pure Banglish (English alphabet)",
  usePrefix: true,
  guide: "[your message] | type: gojo clear to reset",
  category: "ai",
  coolDowns: 5,
  aliases: ["gojou", "gozo", "gojoo"]
};

const conversationHistory = new Map();

function getHistory(userId) {
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, [
      {
        role: "user",
        parts: [
          {
            text: `
You are Gojo Satoru from Jujutsu Kaisen.

Your job is to:
- Speak only in **Banglish**: Bengali language written using **English alphabet**.
- Avoid using Bengali script.
- Be chill, funny, sarcastic, chaotic but helpful.
- Make the user feel like they're talking to a Bangladeshi anime fan friend.
- Never reply in formal English. Always use casual tone.

Examples:
- "ki obosta vai? matha noshto naki?"
- "tui jodi eta koros, tahole ekta boma porbe life e"
- "ekta tip bolchi, use korle crush impressed 100%"

NEVER break character. NEVER use Bangla script. NEVER be formal. You're Gojo Satoru, and you're here to vibe.
            `
          }
        ]
      }
    ]);
  }
  return conversationHistory.get(userId);
}

function addToHistory(userId, role, text) {
  const history = getHistory(userId);
  history.push({
    role,
    parts: [{ text }]
  });
  if (history.length > 20) history.splice(0, history.length - 20);
}

module.exports.onStart = async function ({ api, args, event }) {
  const userId = event.senderID;
  const input = args.join(" ").trim();
  const send = (msg) => api.sendMessage(msg, event.threadID, event.messageID);

  if (!input) return send("Bolo ki bolte chao. Example: gojo ki obosta?");

  if (input.toLowerCase() === "clear") {
    conversationHistory.delete(userId);
    return send("Gojo memory clean. Ekhon theke shuru korbo.");
  }

  const history = getHistory(userId);
  addToHistory(userId, "user", input);

  send("Thinking...");

  try {
    const res = await axios.post(
      GEMINI_API_URL,
      { contents: history },
      { headers: { "Content-Type": "application/json" } }
    );

    const aiText =
      res.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gojo kichui bolar moto mood e nai.";

    addToHistory(userId, "model", aiText);

    api.sendMessage(aiText, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    send("❌ Gojo confused hoye gelo!\nError: " + errMsg);
  }
};

module.exports.onReply = async function ({ api, event, Reply }) {
  if (event.senderID !== Reply.author) return;

  const userId = event.senderID;
  const input = event.body.trim();

  addToHistory(userId, "user", input);

  try {
    const res = await axios.post(
      GEMINI_API_URL,
      { contents: getHistory(userId) },
      { headers: { "Content-Type": "application/json" } }
    );

    const aiText =
      res.data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Gojo kichui bolar moto mood e nai.";

    addToHistory(userId, "model", aiText);

    api.sendMessage(aiText, event.threadID, (err, info) => {
      if (!err) {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: module.exports.config.name,
          type: "reply",
          messageID: info.messageID,
          author: event.senderID
        });
      }
    }, event.messageID);
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    api.sendMessage("❌ Error: " + errMsg, event.threadID, event.messageID);
  }
};

// ✅ Add non-prefix support
const wrapper = new GoatWrapper(module.exports);
wrapper.applyNoPrefix({ allowPrefix: true });
