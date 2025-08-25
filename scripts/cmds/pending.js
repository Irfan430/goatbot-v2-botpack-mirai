module.exports = {
  config: {
    name: "pen",
    aliases: ["pending"],
    version: "1.2",
    author: "xnil6x",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Manage pending group requests"
    },
    longDescription: {
      en: "Approve or reject pending group requests in spam list or unapproved groups"
    },
    category: "utility",
    guide: {
      en: "{pn} - view pending list\n{pn} approve <numbers> - approve selected groups\n{pn} cancel <numbers> - reject selected groups"
    }
  },

  langs: {
    en: {
      invalidNumber: "⚠️ | Invalid Input\n━━━━━━━━━━━━━━\n\n» %1 is not a valid number. Please enter numbers only.",
      cancelSuccess: "❌ | Request Denied\n━━━━━━━━━━━━━━\n\n» Successfully rejected %1 group request(s).",
      approveSuccess: "✅ | Request Approved\n━━━━━━━━━━━━━━\n\n» Successfully approved %1 group(s).",
      cantGetPendingList: "⚠️ | Error\n━━━━━━━━━━━━━━\n\n» Failed to retrieve pending list. Please try again later.",
      returnListPending: "📋 | Pending Groups (%1)\n━━━━━━━━━━━━━━\n\n%2\n\n📌 Reply with:\n✅ 'approve <numbers>'\n❌ 'cancel <numbers>'\n\nExample:\n» 'pen approve 1 2 3'\n» 'pen cancel 4 5'",
      returnListClean: "ℹ️ | No Pending Groups\n━━━━━━━━━━━━━━\n\n» There are currently no groups in the pending list.",
      noSelection: "⚠️ | Missing Input\n━━━━━━━━━━━━━━\n\n» Please specify which groups to process.\n» Example: 'pen approve 1 2 3'",
      instruction: "📝 | Instructions\n━━━━━━━━━━━━━━\n\n1. View pending groups with '{pn}'\n2. Approve with '{pn} approve <numbers>'\n3. Reject with '{pn} cancel <numbers>'\n\nExample:\n» '{pn} approve 1 2 3'\n» '{pn} cancel 4 5'"
    }
  },

  onStart: async function ({ api, event, getLang, commandName, args }) {
    const { threadID, messageID, senderID } = event;

    if (args[0]?.toLowerCase() === 'help') {
      return api.sendMessage(getLang("instruction").replace(/{pn}/g, commandName), threadID, messageID);
    }

    try {
      const [spam, pending] = await Promise.all([
        api.getThreadList(100, null, ["OTHER"]).catch(() => []),
        api.getThreadList(100, null, ["PENDING"]).catch(() => [])
      ]);

      const list = [...spam, ...pending]
        .filter(group => group.isSubscribed && group.isGroup)
        .map((group, index) => ({
          ...group,
          displayIndex: index + 1
        }));

      if (list.length === 0) {
        return api.sendMessage(getLang("returnListClean"), threadID, messageID);
      }

      const msg = list.map(group =>
        `╭───────────────\n` +
        `│ ${group.displayIndex}. ${group.name || `Unnamed (${group.threadID})`}\n` +
        `│ 👥 Members: ${group.participantIDs.length}\n` +
        `│ 🆔 ID: ${group.threadID}\n` +
        `╰───────────────`
      ).join('\n\n');

      api.sendMessage(
        getLang("returnListPending", list.length, msg).replace(/{pn}/g, commandName),
        threadID,
        (err, info) => {
          if (!err) {
            global.GoatBot.onReply.set(info.messageID, {
              commandName,
              messageID: info.messageID,
              author: senderID,
              pending: list
            });

            setTimeout(() => {
              global.GoatBot.onReply.delete(info.messageID);
            }, 5 * 60 * 1000);
          }
        },
        messageID
      );
    } catch (error) {
      console.error(error);
      return api.sendMessage(getLang("cantGetPendingList"), threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply, getLang, commandName }) {
    if (String(event.senderID) !== String(Reply.author)) return;

    const { body, threadID, messageID } = event;
    const args = body.trim().split(/\s+/);
    const action = args[0]?.toLowerCase();

    if (!action || (action !== 'approve' && action !== 'cancel')) {
      return api.sendMessage(
        getLang("noSelection").replace(/{pn}/g, commandName),
        threadID,
        messageID
      );
    }

    const numbers = args.slice(1).map(num => parseInt(num)).filter(num => !isNaN(num));

    if (numbers.length === 0) {
      return api.sendMessage(getLang("invalidNumber", "empty selection"), threadID, messageID);
    }

    const invalidNumbers = numbers.filter(num => num <= 0 || num > Reply.pending.length);
    if (invalidNumbers.length > 0) {
      return api.sendMessage(
        getLang("invalidNumber", invalidNumbers.join(', ')),
        threadID,
        messageID
      );
    }

    const selectedGroups = numbers.map(num => Reply.pending[num - 1]);
    let successCount = 0;
    const processedIDs = new Set();

    for (const group of selectedGroups) {
      if (processedIDs.has(group.threadID)) continue;
      processedIDs.add(group.threadID);

      try {
        if (action === 'approve') {
          await api.sendMessage(
            "🔔 | Group Notification\n━━━━━━━━━━━━━━\n\n» This group has been approved by the admin.",
            group.threadID
          );
        } else {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
        }
        successCount++;
      } catch (error) {
        console.error(`Failed to process group ${group.threadID}:`, error);
      }
    }

    const resultMessage = action === 'approve'
      ? getLang("approveSuccess", successCount)
      : getLang("cancelSuccess", successCount);

    api.sendMessage(resultMessage, threadID, messageID);

    if (global.GoatBot.onReply.has(Reply.messageID)) {
      global.GoatBot.onReply.delete(Reply.messageID);
    }
  }
};