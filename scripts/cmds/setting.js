module.exports = {
 config: {
  name: "setting",
  version: "1.0.5",
  author: "XNIL",
  countDown: 5,
  role: 2,
  shortDescription: {
   vi: "Bảng điều khiển cài đặt bot",
   en: "Bot configuration panel"
  },
  longDescription: {
   vi: "Bảng điều khiển cài đặt và quản lý bot",
   en: "Configuration and management panel for the bot"
  },
  category: "admin",
  guide: {
   vi: "Gửi lệnh để xem bảng điều khiển",
   en: "Send command to view control panel"
  }
 },

 langs: {
  en: {
   panelTitle: "🛠 | Bot Configuration Panel | 🛠",
   settingsTitle: "📁 SETTINGS MANAGEMENT",
   activityTitle: "⚙️ ACTIVITY MANAGEMENT",
   option1: "🥇 ➊ Prefix",
   option2: "🤖 ➋ Bot Name",
   option3: "🧑‍💼 ➌ Admin List",
   option4: "🌐 ➍ Language",
   option5: "🔁 ➎ Auto-Restart",
   option6: "🆙 ➏ Check Updates",
   option7: "👤 ➐ Banned Users",
   option8: "👥 ➑ Banned Groups",
   option9: "📢 ➒ Send Announcement to All",
   option10: "🔍 🔟 Find UID by Name",
   option11: "🧭 ⓫ Find Group ID by Name",
   option12: "🎭 ⓬ Change Group Emoji",
   option13: "📝 ⓭ Change Group Name",
   option14: "📊 ⓮ View Group Info",
   selectPrompt: "Reply with the number to choose option",
   autoRestart: "🔁 Bot will auto-restart at 12:00 PM daily",
   currentVersion: "📦 Current version: ",
   bannedUsers: "🔒 %1 users banned\n\n%2",
   bannedThreads: "🚫 %1 groups banned\n\n%2",
   announcementPrompt: "📢 Reply with the message to send to all groups",
   findUidPrompt: "🔍 Reply with the username to find UID",
   findThreadPrompt: "🧭 Reply with the group name to find ID",
   emojiPrompt: "🎭 Reply with the new emoji",
   namePrompt: "📝 Reply with the new group name",
   announcementSent: "✅ Sent to: %1 groups\n❌ Failed: %2 groups",
   threadInfo: "📊 Group Info:\n\n✨ Name: %1\n🆔 ID: %2\n👀 Approval: %3\n🎭 Emoji: %4\n👥 Members: %5\n👨 Male: %6\n👩 Female: %7\n🛡️ Admins: %8\n💬 Total messages: %9",
   noResult: "❌ No matching result found"
  }
 },

 onStart: async function ({ message, event, args, getLang }) {
  if (!args[0]) {
   const panelMessage = [
    "╔🛠️ 𝗕𝗢𝗧 𝗖𝗢𝗡𝗧𝗥𝗢𝗟 𝗣𝗔𝗡𝗘𝗟 🛠️╗",
    "║",
    `║ 📁 𝗦𝗘𝗧𝗧𝗜𝗡𝗚𝗦 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧`,
    `║ ${getLang("option1")}`,
    `║ ${getLang("option2")}`,
    `║ ${getLang("option3")}`,
    `║ ${getLang("option4")}`,
    `║ ${getLang("option5")}`,
    "║",
    `║ ⚙️ 𝗔𝗖𝗧𝗜𝗩𝗜𝗧𝗬 𝗠𝗔𝗡𝗔𝗚𝗘𝗠𝗘𝗡𝗧`,
    `║ ${getLang("option6")}`,
    `║ ${getLang("option7")}`,
    `║ ${getLang("option8")}`,
    `║ ${getLang("option9")}`,
    `║ ${getLang("option10")}`,
    `║ ${getLang("option11")}`,
    `║ ${getLang("option12")}`,
    `║ ${getLang("option13")}`,
    `║ ${getLang("option14")}`,
    "║",
    `╚ 💬 ${getLang("selectPrompt")} ╝`
   ].join("\n");

   return message.reply(panelMessage, (err, info) => {
    global.GoatBot.onReply.set(info.messageID, {
     commandName: this.config.name,
     author: event.senderID,
     type: "choose"
    });
   });
  }
 },

 onReply: async function ({ api, event, message, Reply, threadsData, usersData, getLang }) {
  const { type, author } = Reply;
  if (event.senderID !== author) return;

  const choice = event.body;

  switch (type) {
   case "choose":
    switch (choice) {
     case "1":
      return message.reply(`📌 Bot Prefix: ${global.GoatBot.config.prefix}`);
     case "2":
      return message.reply(`🤖 Bot Name: ${global.GoatBot.config.botName}`);
     case "3": {
      const adminList = await Promise.all(global.GoatBot.config.adminBot.map(async id => {
       const name = await usersData.getName(id);
       return `👤 ${name} - ${id}`;
      }));
      return message.reply(`🛡️ Admins:\n\n${adminList.join("\n")}`);
     }
     case "4":
      return message.reply(`🌐 Language: ${global.GoatBot.config.language}`);
     case "5":
      return message.reply(getLang("autoRestart"));
     case "6":
      return message.reply(getLang("currentVersion") + this.config.version);
     case "7": {
      const bannedUsers = global.GoatBot.bannedUsers;
      const list = await Promise.all([...bannedUsers.entries()].map(async ([id, reason], i) => {
       const name = await usersData.getName(id);
       return `${i + 1}. ${name} (${id})\n🚫 Reason: ${reason}`;
      }));
      return message.reply(getLang("bannedUsers", bannedUsers.size, list.join("\n\n")));
     }
     case "8": {
      const bannedThreads = global.GoatBot.bannedThreads;
      const list = await Promise.all([...bannedThreads.entries()].map(async ([id, reason], i) => {
       const thread = await threadsData.get(id);
       return `${i + 1}. ${thread.threadName} (${id})\n🚫 Reason: ${reason}`;
      }));
      return message.reply(getLang("bannedThreads", bannedThreads.size, list.join("\n\n")));
     }
     case "9":
      return message.reply(getLang("announcementPrompt"), (err, info) => {
       global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        type: "sendAnnouncement"
       });
      });
     case "10":
      return message.reply(getLang("findUidPrompt"), (err, info) => {
       global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        type: "findUid"
       });
      });
     case "11":
      return message.reply(getLang("findThreadPrompt"), (err, info) => {
       global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        type: "findThread"
       });
      });
     case "12":
      return message.reply(getLang("emojiPrompt"), (err, info) => {
       global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        type: "changeEmoji"
       });
      });
     case "13":
      return message.reply(getLang("namePrompt"), (err, info) => {
       global.GoatBot.onReply.set(info.messageID, {
        commandName: this.config.name,
        author: event.senderID,
        type: "changeName"
       });
      });
     case "14": {
      const thread = await threadsData.get(event.threadID);
      let male = 0, female = 0;

      for (const mem of thread.members) {
       const user = await usersData.get(mem.userID);
       if (user.gender === "MALE") male++;
       if (user.gender === "FEMALE") female++;
      }

      return message.reply(getLang("threadInfo",
       thread.threadName,
       thread.threadID,
       thread.approvalMode ? "On" : "Off",
       thread.emoji,
       thread.members.length,
       male,
       female,
       thread.adminIDs.length,
       thread.messageCount
      ));
     }
     default: return message.reply(getLang("noResult"));
    }
    break;

   case "sendAnnouncement": {
    const threads = await threadsData.getAll();
    const name = await usersData.getName(event.senderID);
    let success = 0, fail = 0;

    for (const thread of threads) {
     if (thread.threadID === event.threadID) continue;
     try {
      await message.send(`📢 Announcement from admin ${name}:\n\n${event.body}`, thread.threadID);
      success++;
      await new Promise(res => setTimeout(res, 300));
     } catch {
      fail++;
     }
    }

    return message.reply(getLang("announcementSent", success, fail));
   }

   case "findUid": {
    try {
     const name = event.body;
     const result = await api.searchUsers(name);
     if (!result.length) return message.reply(getLang("noResult"));

     return message.reply(result.map(user => `👤 ${user.name} - UID: ${user.userID}`).join("\n"));
    } catch {
     return message.reply(getLang("noResult"));
    }
   }

   case "findThread": {
    try {
     const name = event.body.toLowerCase();
     const threads = await threadsData.getAll();
     const result = threads.filter(t => t.threadName.toLowerCase().includes(name));
     if (!result.length) return message.reply(getLang("noResult"));

     return message.reply(result.map((t, i) => `${i + 1}. ${t.threadName} - ${t.threadID}`).join("\n"));
    } catch {
     return message.reply(getLang("noResult"));
    }
   }

   case "changeEmoji":
    try {
     await api.changeThreadEmoji(event.body, event.threadID);
     return message.reply(`🎭 Emoji updated to: ${event.body}`);
    } catch {
     return message.reply("❌ Failed to update emoji");
    }

   case "changeName":
    try {
     await api.setTitle(event.body, event.threadID);
     return message.reply(`📝 Group name changed to: ${event.body}`);
    } catch {
     return message.reply("❌ Failed to change name");
    }
  }
 }
};
