const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "bow",
    aliases: ["boudi", "biye", "biya"],
    version: "2.3",
    author: "X Nil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Send random girl from group as your bou"
    },
    longDescription: {
      en: "Fetch a random girl from current group with profile pic and name"
    },
    category: "fun",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event, usersData }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);

      const femaleUsers = threadInfo.userInfo.filter(u => {
        if (!u.gender) return false;
        const g = u.gender.toString().toLowerCase();
        return g === "1" || g === "female" || g === "f";
      });

      if (femaleUsers.length === 0) {
        return api.sendMessage("এই গ্রুপে কোনো বউ (মেয়ে) পাওয়া যায়নি 😔", threadID, messageID);
      }

      const randomGirl = femaleUsers[Math.floor(Math.random() * femaleUsers.length)];
      const id = randomGirl.id;

      const getAvatarUrl = async (uid) => await usersData.getAvatarUrl(uid);
      const imgURL = await getAvatarUrl(id);

      if (!imgURL) {
        return api.sendMessage("❌ বউয়ের প্রোফাইল ছবি পাওয়া যায়নি!", threadID, messageID);
      }

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const imgPath = path.join(cacheDir, `${id}.jpg`);

      const axios = require("axios");
      const response = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, response.data);

      const userInfo = await api.getUserInfo(id);
      const name = userInfo[id]?.name || "Unknown";

      const msg = `🥰 নে তোর বউ খুঁজে দিলাম!\n\n👩‍🦰 নাম: ${name}\n🆔 ID: ${id}`;

      api.sendMessage(
        {
          body: msg,
          attachment: fs.createReadStream(imgPath)
        },
        threadID,
        () => fs.unlinkSync(imgPath)
      );

    } catch (e) {
      console.error(e);
      api.sendMessage("❌ বউ খুঁজতে গিয়ে সমস্যা হলো!", threadID, messageID);
    }
  }
};