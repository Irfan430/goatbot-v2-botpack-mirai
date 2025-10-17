const { getStreamsFromAttachment } = global.utils;

module.exports = {
  config: {
    name: "notification",
    aliases: ["notify", "noti"],
    version: "1.9",
    author: "NTKhang + X-NIL Styled",
    countDown: 5,
    role: 2,
    description: {
      vi: "Gửi thông báo từ admin đến all box",
      en: "Send notification from admin to all boxes"
    },
    category: "owner",
    guide: {
      en: "{pn} <message>"
    },
    envConfig: {
      delayPerGroup: 250
    }
  },

  langs: {
    vi: {
      missingMessage: "❗ Vui lòng nhập tin nhắn bạn muốn gửi đến tất cả các nhóm.",
      notification: "📢 𝗧𝗛Ô𝗡𝗚 𝗕Á𝗢 𝗧𝗨̛̀ 𝗤𝗨𝗔̉𝗡 𝗧𝗥𝗜̣ 𝗩𝗜𝗘̂𝗡 𝗕𝗢𝗧",
      sendingNotification: "🚀 Đang bắt đầu gửi thông báo đến %1 nhóm chat...",
      sentNotification: "✅ Đã gửi thành công đến %1 nhóm!",
      errorSendingNotification: "⚠️ Gửi thất bại đến %1 nhóm:\n%2"
    },
    en: {
      missingMessage: "❗ Please enter the message you want to send to all groups.",
      notification: "📢 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 𝗙𝗥𝗢𝗠 𝗕𝗢𝗧 𝗔𝗗𝗠𝗜𝗡",
      sendingNotification: "🚀 Starting to send notification to %1 chat groups...",
      sentNotification: "✅ Successfully sent notification to %1 groups!",
      errorSendingNotification: "⚠️ Failed to send to %1 groups:\n%2"
    }
  },

  onStart: async function ({ message, api, event, args, commandName, envCommands, threadsData, getLang, Users }) {
    const { delayPerGroup } = envCommands[commandName];
    if (!args[0]) return message.reply(getLang("missingMessage"));

    let senderName;
    try {
      senderName = await Users.getName(event.senderID);
    } catch {
      senderName = "Unknown";
    }

    const senderProfile = `https://m.me/${event.senderID}`;
    const notificationBody = `╭─────────────⭓
${getLang("notification")}
👤 Høpêléss Ņîl 
🔗 ${senderProfile}
(⛔ Please do not reply to this message)
╰─────────────⭓

📝 ${args.join(" ")}`;

    const formSend = {
      body: notificationBody,
      attachment: await getStreamsFromAttachment(
        [
          ...event.attachments,
          ...(event.messageReply?.attachments || [])
        ].filter(item => ["photo", "png", "animated_image", "video", "audio"].includes(item.type))
      )
    };

    const allThreadID = (await threadsData.getAll()).filter(
      t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup
    );

    message.reply(getLang("sendingNotification", allThreadID.length));

    let sendSucces = 0;
    const sendError = [];
    const waitingSend = [];

    for (const thread of allThreadID) {
      const tid = thread.threadID;
      try {
        waitingSend.push({
          threadID: tid,
          pending: api.sendMessage(formSend, tid)
        });
        await new Promise(res => setTimeout(res, delayPerGroup));
      } catch (e) {
        sendError.push({ threadIDs: [tid], errorDescription: e.errorDescription || "Unknown error" });
      }
    }

    for (const sended of waitingSend) {
      try {
        await sended.pending;
        sendSucces++;
      } catch (e) {
        const errorDescription = e.errorDescription || "Unknown error";
        const exist = sendError.find(item => item.errorDescription === errorDescription);
        if (exist) exist.threadIDs.push(sended.threadID);
        else sendError.push({ threadIDs: [sended.threadID], errorDescription });
      }
    }

    let msg = "";
    if (sendSucces > 0)
      msg += `\n✅ ${getLang("sentNotification", sendSucces)}`;
    if (sendError.length > 0)
      msg += `\n\n⚠️ ${getLang(
        "errorSendingNotification",
        sendError.reduce((a, b) => a + b.threadIDs.length, 0),
        sendError.map(e => `🔻 ${e.errorDescription}\n${e.threadIDs.map(tid => `  • ${tid}`).join("\n")}`).join("\n\n")
      )}`;

    message.reply(msg);
  }
};
