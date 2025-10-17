const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "group",
    aliases: [],
    version: "2.2",
    author: "xnil6x",
    description: "Manage group: name, emoji, image, and info",
    category: "box chat",
    role: 1
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, messageReply } = event;
    const command = args[0]?.toLowerCase();
    const value = args.slice(1).join(" ");

    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (command === "name") {
      if (!value) return send("⚠️ | Please provide a group name.\n\n📌 Usage:\n/group name <new name>");
      try {
        await api.setTitle(value, threadID);
        return send(`✅ | Group name updated to:\n🏷️ ${value}`);
      } catch {
        return send("❌ | Failed to update group name. Make sure I have permission.");
      }
    }

    if (command === "emoji") {
      if (!value) return send("⚠️ | Please provide an emoji.\n\n📌 Usage:\n/group emoji 😄");
      try {
        await api.changeThreadEmoji(value, threadID);
        return send(`✅ | Group emoji updated to: ${value}`);
      } catch {
        return send("❌ | Failed to set emoji. Ensure it's valid.");
      }
    }

    if (command === "image") {
      if (!messageReply || !messageReply.attachments?.length)
        return send("⚠️ | Please reply to an image message to set as group photo.");

      const attachment = messageReply.attachments[0];
      if (!attachment.type?.includes("photo"))
        return send("⚠️ | Only photo replies are accepted.");

      const url = attachment.url;
      const path = `${__dirname}/cache/group-photo-${threadID}.jpg`;

      try {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(path, Buffer.from(res.data, "binary"));
        await api.changeGroupImage(fs.createReadStream(path), threadID);
        fs.unlinkSync(path);
        return send("✅ | Group photo updated successfully!");
      } catch {
        return send("❌ | Failed to update group photo. Ensure I have permission.");
      }
    }

    if (!command) {
      try {
        const info = await api.getThreadInfo(threadID);
        const name = info.threadName || "Unnamed Group";
        const emoji = info.emoji || "None";
        const admins = info.adminIDs.length;
        const members = info.participantIDs.length;
        const approval = info.approvalMode ? "🔒 Enabled" : "🔓 Disabled";
        const joinLink = info.inviteLink || "N/A";

        const msg =
`╭─────🎀 GROUP INFO 🎀────────╮
│ 🏷️ Name: ${name}
│ 😊 Emoji: ${emoji}
│ 👥 Members: ${members}
│ 🛡️ Admins: ${admins}
│ 🔐 Approval Mode: ${approval}
│ 🔗 Join Link: ${joinLink}
╰────────────────────────╯`;

        return send(msg);
      } catch {
        return send("❌ | Failed to fetch group info.");
      }
    }

    // If invalid subcommand
    return send(
`📌 Group Command Menu

🔹 /group name <new name> — Change group name
🔹 /group emoji 😄 — Set group emoji
🔹 /group image — Reply to a photo to set as group image
🔹 /group — Show current group information`
    );
  }
};
