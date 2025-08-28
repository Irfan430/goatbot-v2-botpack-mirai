module.exports = {
  config: {
    name: "listbox",
    aliases: ["gclist"],
    author: "xnil6x",
    version: "2.3",
    cooldowns: 5,
    dev: true,
    role: 2,
    shortDescription: {
      en: "List all group chats the bot is in."
    },
    longDescription: {
      en: "Use this command to list all group chats the bot is currently in."
    },
    category: "owner",
    guide: {
      en: "{p}{n} [page|next|prev]"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      const groupList = await api.getThreadList(200, null, ["INBOX"]); // fetch up to 200
      const filteredList = groupList.filter(group => group.threadName !== null);

      if (filteredList.length === 0) {
        return api.sendMessage("❌ No group chats found.", event.threadID, event.messageID);
      }

      const pageSize = 20; // groups per page
      const totalPages = Math.ceil(filteredList.length / pageSize);

      // static cache per thread (so "next" and "prev" works)
      if (!global.listboxPage) global.listboxPage = {};
      const currentThread = event.threadID;

      let page;

      // if user typed number
      if (args[0] && !isNaN(args[0])) {
        page = parseInt(args[0]);
      } 
      // if user typed "next"
      else if (args[0] && args[0].toLowerCase() === "next") {
        page = (global.listboxPage[currentThread] || 1) + 1;
      } 
      // if user typed "prev"
      else if (args[0] && args[0].toLowerCase() === "prev") {
        page = (global.listboxPage[currentThread] || 1) - 1;
      } 
      // default = 1
      else {
        page = 1;
      }

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;

      global.listboxPage[currentThread] = page;

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const currentPageGroups = filteredList.slice(startIndex, endIndex);

      const formattedList = currentPageGroups.map((group, index) =>
        `┃ ${(startIndex + index + 1)}. 『${group.threadName}』\n┃ 🆔 ${group.threadID}`
      );

      const message = [
        "╭─────────────❃",
        "│ 📜 𝗟𝗜𝗦𝗧 𝗢𝗙 𝗚𝗥𝗢𝗨𝗣 𝗖𝗛𝗔𝗧𝗦",
        "│──────────────────",
        formattedList.join("\n"),
        "│──────────────────",
        `│ 📄 Page ${page}/${totalPages} | Total: ${filteredList.length} groups`,
        "╰───────────────✦",
        "",
        "👉 Use: /listbox [page|next|prev]"
      ].join("\n");

      await api.sendMessage(message, event.threadID, event.messageID);
    } catch (error) {
      console.error("Error listing group chats", error);
      await api.sendMessage("⚠️ An error occurred while fetching group list.", event.threadID, event.messageID);
    }
  }
};