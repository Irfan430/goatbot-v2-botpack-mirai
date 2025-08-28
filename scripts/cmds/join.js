module.exports = {
  config: {
    name: "join",
    version: "3.1",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    dev: true,
    shortDescription: "Join a group that the bot is in",
    longDescription: "Paginated group list, reply with number to join, supports direct page jump or next/prev.",
    category: "owner",
    guide: { en: "{p}{n} [page|next|prev]" },
  },

  onStart: async function ({ api, event, args }) {
    try {
      const groupList = await api.getThreadList(200, null, ["INBOX"]);
      const filteredList = groupList.filter(g => g.isGroup && g.isSubscribed);

      if (!filteredList.length) return api.sendMessage("❌ No group chats found.", event.threadID);

      const pageSize = 15;
      const totalPages = Math.ceil(filteredList.length / pageSize);
      if (!global.joinPage) global.joinPage = {};
      const currentThread = event.threadID;

      let page = 1;
      if (args[0]) {
        const input = args[0].toLowerCase();
        if (input === "next") page = (global.joinPage[currentThread] || 1) + 1;
        else if (input === "prev") page = (global.joinPage[currentThread] || 1) - 1;
        else if (input.includes("/")) page = parseInt(input.split("/")[0]) || 1;
        else page = parseInt(input) || 1;
      }

      if (page < 1) page = 1;
      if (page > totalPages) page = totalPages;
      global.joinPage[currentThread] = page;

      const startIndex = (page - 1) * pageSize;
      const currentGroups = filteredList.slice(startIndex, startIndex + pageSize);

      const formatted = currentGroups.map((g, i) =>
        `┃ ${startIndex + i + 1}. 『${g.threadName || "Unnamed Group"}』\n┃ 👥 ${g.participantIDs.length} Members\n┃ 🆔 ${g.threadID}\n┃`
      );

      const message = [
        "╭─────────────❃",
        "│ 🤝 𝗝𝗢𝗜𝗡 𝗔 𝗚𝗥𝗢𝗨𝗣 𝗖𝗛𝗔𝗧",
        "│──────────────────",
        formatted.join("\n"),
        "│──────────────────",
        `│ 📄 Page ${page}/${totalPages} | Total: ${filteredList.length} groups`,
        "│ 📌 Maximum Members per group: 250",
        "╰───────────────✦",
        "",
        "👉 Reply with the number of the group you want to join."
      ].join("\n");

      const sentMessage = await api.sendMessage(message, event.threadID);
      global.GoatBot.onReply.set(sentMessage.messageID, {
        commandName: "join",
        messageID: sentMessage.messageID,
        author: event.senderID,
        list: filteredList,
        page,
        pageSize
      });

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Error fetching group list.", event.threadID);
    }
  },

  onReply: async function ({ api, event, Reply, args }) {
    const { author, list, page, pageSize } = Reply;
    if (event.senderID !== author) return;

    const groupIndex = parseInt(args[0], 10);
    if (isNaN(groupIndex) || groupIndex <= 0) {
      return api.sendMessage("⚠️ Invalid number. Reply with a valid group number.", event.threadID, event.messageID);
    }

    const startIndex = (page - 1) * pageSize;
    const currentGroups = list.slice(startIndex, startIndex + pageSize);

    if (groupIndex > currentGroups.length) {
      return api.sendMessage("⚠️ Number out of range for this page.", event.threadID, event.messageID);
    }

    try {
      const selected = currentGroups[groupIndex - 1];
      const groupID = selected.threadID;
      const members = await api.getThreadInfo(groupID);

      if (members.participantIDs.includes(event.senderID)) {
        return api.sendMessage(`⚠️ You are already in 『${selected.threadName}』`, event.threadID, event.messageID);
      }
      if (members.participantIDs.length >= 250) {
        return api.sendMessage(`🚫 Group full: 『${selected.threadName}』`, event.threadID, event.messageID);
      }

      await api.addUserToGroup(event.senderID, groupID);
      api.sendMessage(`✅ You joined 『${selected.threadName}』`, event.threadID, event.messageID);

      // Optional: Bot leaves its own group (if needed)
      // await api.removeUserFromGroup(api.getCurrentUserID(), event.threadID);

    } catch (e) {
      console.error(e);
      api.sendMessage("⚠️ Failed to join group. Try again later.", event.threadID, event.messageID);
    } finally {
      global.GoatBot.onReply.delete(event.messageID);
    }
  },
};