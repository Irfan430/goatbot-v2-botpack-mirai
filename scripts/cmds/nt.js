const axios = require("axios");
const url = `https://rasin-x-apis-main.onrender.com/api/rasin`;

module.exports = {
  config: {
    name: "teach",
    aliases: ['nt'],
    version: "1.4",
    author: "Rasin",
    prefix: false,
    role: 0,
    category: "teach simsimi",
    guide: {
      en: "{pn}"
    }
  },
  
  onStart: async function({ message, event, api }) {
    await this.rasin(event.senderID, message, event);
  },
  
  onReply: async function({ message, event, Reply, api, usersData }) {
    if (event.senderID !== Reply.author) {
      return message.reply("⚠️ This question is not for you!");
    }

    if (Reply.type === "answerQ") {
      const userReply = event.body?.trim();
      if (!userReply) return message.reply("Please provide a valid answer!");
      
      try {
        const uid = Reply.uid;
        const response = await axios.get(
          `http://46.247.108.38:6148/teach?ask=${encodeURIComponent(Reply.qns)}&ans=${encodeURIComponent(userReply)}&uid=${encodeURIComponent(uid)}`
        );
        
        if (response.data.success === "true") {
          const userName = await this.getUserName(event.senderID, api);

          // ✅ টাকা আর এক্সপি সেট করা
          const userData = await usersData.get(event.senderID) || {};
          const currentMoney = userData.money || 0;
          const currentExp = userData.exp || 0;

          const newMoney = currentMoney + 10000;
          const newExp = currentExp + 400;

          await usersData.set(event.senderID, {
            money: newMoney,
            exp: newExp
          });

          message.reply({
            body: `✅ Successfully 🎉\n\n` +
                  `📌 Question: ${Reply.qns}\n` +
                  `💬 Reply: ${userReply}\n\n` +
                  `👨‍🏫 Teacher: ${userName}\n\n` +
                  `💰 Reward: +10000 Money (Total: ${newMoney})\n` +
                  `⭐ Exp: +400 (Total: ${newExp})`
          });
          
          this.rasin(event.senderID, message, event);
          
        } else {
          message.reply(`Failed to save: ${response.data.message || "Unknown error"}`);
        }
      } catch (error) {
        console.error("Error saving teach:", error);
        if (error.response && error.response.status === 403) {
          message.reply("🚫 Content not allowed! Keep it clean 🙂🙏🏻");
        } else if (error.response) {
          message.reply(`Error: ${error.response.data?.message || error.response.statusText}`);
        } else {
          message.reply("Error saving your answer. Try again later.");
        }
      }
    }
  },
  
  rasin: async function(userID, message, event) {
    try {
      const uid = event.senderID;
      const res = await axios.get(`${url}/nusu`);
      const qns = res.data.question;
      
      message.reply({
        body: `Your Question:\n\nQuestion: ${qns}\n\n🎀 Reply this message with your answer.`
      }, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: this.config.name,
            type: "answerQ",
            author: userID,
            uid: uid,
            qns: qns,
            messageID: info.messageID
          });
        }
      });
    } catch (err) {
      console.error("Error fetching question:", err);
      message.reply("❌ Error fetching random question. Please try again later.");
    }
  },
  
  getUserName: async function(userID, api) {
    try {
      const userInfo = await api.getUserInfo(userID);
      return userInfo[userID]?.name || "Shakib Khan er mama";
    } catch {
      return "Hero Alom er kaka";
    }
  }
};