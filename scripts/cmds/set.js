module.exports = {
  config: {
    name: "set",
    version: "2.0",
    author: "xnil6x",
    shortDescription: "Admin data management",
    longDescription: "Set user money, exp, or custom variables (admin only)",
    category: "Admin",
    guide: {
      en: "{p}set money [amount] [@user]\n{p}set exp [amount] [@user]\n{p}set custom [variable] [value] [@user]"
    },
    role: 2
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const ADMIN_UIDS = ["100001986888287", "100078794143432"];
      
      if (!ADMIN_UIDS.includes(event.senderID.toString())) {
        return api.sendMessage("⛔ Access Denied: Admin privileges required", event.threadID);
      }

      const action = args[0]?.toLowerCase();
      const amount = parseFloat(args[1]);
      const targetID = Object.keys(event.mentions)[0] || event.senderID;
      const userData = await usersData.get(targetID);

      if (!userData) {
        return api.sendMessage("❌ User not found in database", event.threadID);
      }

      switch (action) {
        case 'money':
          if (isNaN(amount)) return api.sendMessage("❌ Invalid amount", event.threadID);
          await usersData.set(targetID, { money: amount });
          return api.sendMessage(`💰 Set money to ${amount} for ${userData.name}`, event.threadID);

        case 'exp':
          if (isNaN(amount)) return api.sendMessage("❌ Invalid amount", event.threadID);
          await usersData.set(targetID, { exp: amount });
          return api.sendMessage(`🌟 Set exp to ${amount} for ${userData.name}`, event.threadID);

        case 'custom':
          const variable = args[1];
          const value = args[2];
          if (!variable || value === undefined) {
            return api.sendMessage("❌ Usage: {p}set custom [variable] [value] [@user]", event.threadID);
          }
          await usersData.set(targetID, { [variable]: value });
          return api.sendMessage(`🔧 Set ${variable} to ${value} for ${userData.name}`, event.threadID);

        default:
          return api.sendMessage("❌ Invalid action. Available options: money, exp, custom", event.threadID);
      }

    } catch (error) {
      console.error("Admin Set Error:", error);
      return api.sendMessage("⚠️ Command failed: " + error.message, event.threadID);
    }
  }
};
