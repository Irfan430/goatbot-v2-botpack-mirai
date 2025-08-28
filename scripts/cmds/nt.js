const axios = require("axios");
const mongoose = require("mongoose");

mongoose.connect('m', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const ReplyModel = mongoose.models.Reply || mongoose.model('Reply', new mongoose.Schema({
  senderID: String,
  text: String,
  time: { type: Date, default: Date.now }
}));

const badWords = ["magi", "voda", "fuck", "dick", "hot", "dhon", "suck", " vuda", "heda", "bby", "🙂"];

function containsBadWord(text) {
  return badWords.some(word => text.toLowerCase().includes(word));
}

function formatMoney(num) {
  const units = ["", "k", "𝐌", "𝐁", "𝐓", "𝐐", "𝐐𝐢", "𝐒𝐱", "𝐒𝐩", "𝐎𝐜", "𝐍", "𝐃"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return Number(num.toFixed(1)) + units[unit];
}

const getBaseApiUrl = async () => {
  try {
    const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
    return base.data?.mahmud + "/api/jan";
  } catch (err) {
    console.error("Failed to fetch base API URL:", err.message);
    return null;
  }
};

module.exports.config = {
  name: "jant",
  aliases: ["jt", "nt"],
  version: "1.7",
  author: "MahMUD",
  countDown: 0,
  role: 0,
  category: "ai",
  guide: {
    en: "{pn} - send a random question\nReply to the bot's message to auto teach\nReply 'uns' to skip and get next"
  }
};

async function sendRandomQuestion(message, senderID) {
  try {
    const replies = await ReplyModel.find();
    if (!replies || replies.length === 0)
      return message.reply("❌ response not found ।");
    
    const cleanReplies = replies.filter(r => !containsBadWord(r.text));
    if (cleanReplies.length === 0)
      return message.reply("❌ | No clean question available. Try again later.");
    
    const randomReply = cleanReplies[Math.floor(Math.random() * cleanReplies.length)];
    const msg = await message.reply(`${randomReply.text}\n\n• 𝐑𝐞𝐩𝐥𝐲 𝐲𝐨𝐮𝐫 𝐭𝐞𝐚𝐜𝐡 𝐚𝐧𝐬𝐰𝐞𝐫\n• 𝐓𝐲𝐩𝐞 'uns' 𝐭𝐨 𝐬𝐤𝐢𝐩`);
    
    global.GoatBot.onReply.set(msg.messageID, {
      commandName: "jant",
      trigger: randomReply.text,
      author: senderID,
      id: randomReply._id
    });
    
  } catch (err) {
    console.error("Error in sendRandomQuestion:", err);
    return message.reply("❌ error try Again।");
  }
}

module.exports.onStart = async ({ message, event }) => {
  await sendRandomQuestion(message, event.senderID);
};

module.exports.onReply = async ({ event, message, Reply: replyData, usersData }) => {
  if (event.senderID !== replyData.author) return;
  
  const input = event.body.trim().toLowerCase();
  
  if (input === "uns") {
    try {
      
      await ReplyModel.findByIdAndDelete(replyData.id);
      await message.reply("✅ | Teach skip successfully,  sending another teach");
      await sendRandomQuestion(message, event.senderID);
    } catch (err) {
      console.error("Error skipping question:", err);
      await message.reply("❌ Couldn't skip the question. Try again.");
    }
    return;
  }
  
  const apiUrl = await getBaseApiUrl();
  if (!apiUrl) {
    return message.reply("try Again");
  }
  
  try {
    const res = await axios.get(
          `http://46.247.108.38:6148/teach?ask=${encodeURIComponent(replyData.trigger)}&ans=${encodeURIComponent(event.body)}&uid=${encodeURIComponent(event.senderID)}`
        );
    const userName = await usersData.getName(event.senderID) || "Unknown User";
    const rewardCoin = 10000;
    
    const userData = await usersData.get(event.senderID) || { money: 0 };
    userData.money += rewardCoin;
    await usersData.set(event.senderID, userData);
    
    await message.reply(
      `✅ Replies added: "${event.body}" to "${replyData.trigger}"\n` +
      `• 𝐓𝐞𝐚𝐜𝐡𝐞𝐫: ${userName}\n` +
      `• 𝐓𝐨𝐭𝐚𝐥: ${res.data?.count || 0}\n` +
      `• 𝐘𝐨𝐮 𝐰𝐢𝐧 ${formatMoney(rewardCoin)} balance`
    );
    
    await ReplyModel.findByIdAndDelete(replyData.id);
    
    await sendRandomQuestion(message, event.senderID);
    
  } catch (err) {
    console.error("Error during reply save:", err);
    const errMsg = err.response?.data || err.message || "❌ Unknown error occurred.";
    await message.reply(errMsg);
    await sendRandomQuestion(message, event.senderID);
  }
};