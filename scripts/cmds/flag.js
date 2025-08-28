const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "flag",
    aliases: ["flagGame"],
    version: "3.1",
    author: "Dipto",
    countDown: 0,
    role: 0,
    description: {
      en: "Guess the flag name",
    },
    category: "game",
    guide: {
      en: "{pn} | {pn} list",
    },
  },

  onReply: async function ({ api, event, Reply, usersData }) {
    const { country, attempts } = Reply;
    const maxAttempts = 5;

    if (event.type !== "message_reply") return;

    const reply = event.body.toLowerCase();
    const getCoin = 3000;
    const getExp = 300;
    const userData = await usersData.get(event.senderID);

    if (attempts >= maxAttempts) {
      await api.sendMessage(
        "🚫 | You have reached the maximum number of attempts (5).",
        event.threadID,
        event.messageID
      );
      return;
    }

    if (isNaN(reply)) {
      if (reply === country.toLowerCase()) {
        try {
          await api.unsendMessage(Reply.messageID);

          const newWins = (userData.data.flagWins || 0) + 1;
          await usersData.set(event.senderID, {
            money: userData.money + getCoin,
            exp: userData.exp + getExp,
            data: {
              ...userData.data,
              flagWins: newWins,
            },
          });
        } catch (err) {
          console.log("Error: ", err.message);
        } finally {
          const message = `✅ | Correct answer!\nYou earned ${getCoin} coins and ${getExp} exp.`;
          await api.sendMessage(message, event.threadID, event.messageID);
        }
      } else {
        Reply.attempts += 1;
        global.GoatBot.onReply.set(Reply.messageID, Reply);
        api.sendMessage(
          `❌ | Wrong Answer. You have ${maxAttempts - Reply.attempts} attempts left.\n✅ | Try Again!`,
          event.threadID,
          event.messageID
        );
      }
    }
  },

  onStart: async function ({ api, args, event, usersData }) {
    try {
      if (!args[0]) {
        const response = await axios.get(
          `${await baseApiUrl()}/flagGame?randomFlag=random`
        );
        const { link, country } = response.data;

        await api.sendMessage(
          {
            body: "🌍 Guess this flag name:",
            attachment: await global.utils.getStreamFromURL(link),
          },
          event.threadID,
          (error, info) => {
            if (error) return console.error(error);
            global.GoatBot.onReply.set(info.messageID, {
              commandName: this.config.name,
              type: "reply",
              messageID: info.messageID,
              author: event.senderID,
              link,
              country,
              attempts: 0,
            });
          },
          event.messageID
        );
      } else if (args[0].toLowerCase() === "list") {
        const allUsers = await usersData.getAll();
        const stats = [];

        for (const user of allUsers) {
          const wins = user.data.flagWins || 0;
          if (wins > 0) {
            stats.push({
              id: user.userID,
              name: user.name,
              wins,
            });
          }
        }

        if (stats.length === 0) {
          return api.sendMessage(
            "📉 | No one has won any flag games yet.",
            event.threadID,
            event.messageID
          );
        }

        stats.sort((a, b) => b.wins - a.wins);

        let message = "🌍 Global Flag Game Rankings 🌍\n\n";
        stats.forEach((u, i) => {
          message += `${i + 1}. ${u.name}: ${u.wins} wins\n`;
        });

        return api.sendMessage(message, event.threadID, event.messageID);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      api.sendMessage(
        `⚠️ Error: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },
};