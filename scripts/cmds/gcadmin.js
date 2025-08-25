module.exports = {
  config: {
    name: "gcadmin",
    aliases: ["groupadmin", "setadmin"],
    version: "2.1",
    author: "xnil6x ✨",
    countDown: 5,
    role: 2,
    shortDescription: "Manage group admins",
    longDescription: "Add or remove group admins safely using UID or mention.",
    category: "box",
    guide: {
      en: "{p}{n} add <uid | @mention>\n{p}{n} remove <uid | @mention>"
    }
  },

  onStart: async function ({ api, event, args }) {
    const command = (args[0] || "").toLowerCase();
    const target = args.slice(1).join(" ");
    const threadID = event.threadID;

    if (!command || !target) {
      return api.sendMessage(
        `⚠️ Invalid usage!\n\n📌 Usage:\n${this.config.guide.en}`,
        threadID
      );
    }

    switch (command) {
      case "add":
        await addAdmin(api, event, threadID, target);
        break;
      case "remove":
        await removeAdmin(api, event, threadID, target);
        break;
      default:
        api.sendMessage(
          `❌ Unknown command!\n\n📌 Usage:\n${this.config.guide.en}`,
          threadID
        );
    }
  }
};

async function addAdmin(api, event, threadID, target) {
  try {
    const userID = await resolveUserID(api, event, target);
    if (!userID) return api.sendMessage("❌ Please mention or give a valid UID!", threadID);

    const userInfo = await api.getUserInfo(userID);
    const userName = userInfo[userID]?.name || "Unknown User";

    await api.changeAdminStatus(threadID, userID, true);
    api.sendMessage(
      `✅ @${userName} is now an admin! 🎉`,
      threadID,
      null,
      { mentions: [{ tag: userName, id: userID }] }
    );
  } catch (error) {
    console.error("Error adding admin:", error);
    api.sendMessage("❌ Failed to add user as admin.", threadID);
  }
}

async function removeAdmin(api, event, threadID, target) {
  try {
    const userID = await resolveUserID(api, event, target);
    if (!userID) return api.sendMessage("❌ Please mention or give a valid UID!", threadID);

    const userInfo = await api.getUserInfo(userID);
    const userName = userInfo[userID]?.name || "Unknown User";

    await api.changeAdminStatus(threadID, userID, false);
    api.sendMessage(
      `⚡ @${userName} has been removed from admin position.`,
      threadID,
      null,
      { mentions: [{ tag: userName, id: userID }] }
    );
  } catch (error) {
    console.error("Error removing admin:", error);
    api.sendMessage("❌ Failed to remove user from admin position.", threadID);
  }
}

async function resolveUserID(api, event, target) {
  if (Object.keys(event.mentions || {}).length > 0) {
    return Object.keys(event.mentions)[0]; 
  }

  if (/^\d+$/.test(target)) {
    return target;
  }

  return null;
}