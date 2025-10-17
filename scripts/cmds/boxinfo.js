const fs = require("fs-extra");
const request = require("request");

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["boxinfo", "gcinfo"],
    version: "2.3",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: "Get detailed group information",
    longDescription: "Displays comprehensive information about the current group chat",
    category: "box chat",
    guide: {
      en: "{p}groupinfo"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const threadName = threadInfo.threadName || "No Name";
      const threadID = event.threadID;
      const approvalMode = threadInfo.approvalMode ? "✅ ON" : "❌ OFF";
      const emoji = threadInfo.emoji || "None";
      const memberCount = threadInfo.participantIDs.length;
      const messageCount = threadInfo.messageCount || "Unknown";

      let maleCount = 0;
      let femaleCount = 0;
      let unknownGender = 0;

      for (const user of threadInfo.userInfo) {
        if (user.gender === "MALE") maleCount++;
        else if (user.gender === "FEMALE") femaleCount++;
        else unknownGender++;
      }

      let adminList = [];
      if (threadInfo.adminIDs && threadInfo.adminIDs.length > 0) {
        const adminIDs = threadInfo.adminIDs.map(admin => admin.id);

        const namesFromThreadInfo = adminIDs.map(id => {
          const user = threadInfo.userInfo.find(u => u.id == id);
          return user?.name || null;
        });

        const adminsNeedingNames = adminIDs.filter((id, index) => !namesFromThreadInfo[index]);

        if (adminsNeedingNames.length > 0) {
          try {
            const adminInfo = await api.getUserInfo(adminsNeedingNames);
            adminIDs.forEach((id, index) => {
              const name =
                namesFromThreadInfo[index] ||
                adminInfo[id]?.name ||
                `User [${id}]`;
              adminList.push(`✦ ${name}`);
            });
          } catch (e) {
            console.error("Error fetching admin info:", e);
            adminIDs.forEach(id => {
              const user = threadInfo.userInfo.find(u => u.id == id);
              const name = user?.name || `User [${id}]`;
              adminList.push(`✦ ${name}`);
            });
          }
        } else {
          adminIDs.forEach(id => {
            const user = threadInfo.userInfo.find(u => u.id == id);
            adminList.push(`✦ ${user?.name || `User [${id}]`}`);
          });
        }
      } else {
        adminList = ["No admins found"];
      }

      // Group image download (if available)
      let groupImage;
      if (threadInfo.imageSrc) {
        const imagePath = __dirname + "/cache/group_image.jpg";
        await new Promise((resolve) => {
          request(encodeURI(threadInfo.imageSrc))
            .pipe(fs.createWriteStream(imagePath))
            .on("close", resolve);
        });
        groupImage = fs.createReadStream(imagePath);
      }

      const messageBody = `
╭───────────◇───────────╮
    🏷️ 𝗚𝗥𝗢𝗨𝗣 𝗜𝗡𝗙𝗢𝗥𝗠𝗔𝗧𝗜𝗢𝗡  
╰───────────◇───────────╯

🔹 𝗡𝗮𝗺𝗲: ${threadName}
🔹 𝗜𝗗: ${threadID}
🔹 𝗔𝗽𝗽𝗿𝗼𝘃𝗮𝗹 𝗠𝗼𝗱𝗲: ${approvalMode}
🔹 𝗘𝗺𝗼𝗷𝗶: ${emoji}

📊 𝗠𝗲𝗺𝗯𝗲𝗿 𝗦𝘁𝗮𝘁𝗶𝘀𝘁𝗶𝗰𝘀:
├─ 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝗺𝗯𝗲𝗿𝘀: ${memberCount}
├─ 𝗠𝗮𝗹𝗲: ${maleCount}
├─ 𝗙𝗲𝗺𝗮𝗹𝗲: ${femaleCount}
└─ 𝗨𝗻𝗸𝗻𝗼𝘄𝗻: ${unknownGender}

👑 𝗔𝗱𝗺𝗶𝗻𝘀 (${adminList.length}):
${adminList.join("\n")}

📈 𝗔𝗰𝘁𝗶𝘃𝗶𝘁𝘆:
└─ 𝗧𝗼𝘁𝗮𝗹 𝗠𝗲𝘀𝘀𝗮𝗴𝗲𝘀: ${messageCount}

╰──────────────────────╯
      `.trim();

      if (groupImage) {
        await api.sendMessage(
          {
            body: messageBody,
            attachment: groupImage
          },
          event.threadID,
          () => fs.unlinkSync(__dirname + "/cache/group_image.jpg")
        );
      } else {
        await api.sendMessage(messageBody, event.threadID);
      }

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Failed to fetch group info.", event.threadID);
    }
  }
};
