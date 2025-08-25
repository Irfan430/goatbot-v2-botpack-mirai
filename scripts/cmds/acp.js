const moment = require("moment-timezone");

module.exports = {
  config: {
    name: "accept",
    aliases: ['acp'],
    version: "1.0",
    author: "xnil6x",
    countDown: 8,
    role: 0,
    shortDescription: "Manage friend requests stylishly",
    longDescription: "Accept or reject friend requests with a sleek interface",
    category: "Utility",
    guide: {
      en: "{pn} [add|del] [number|all]"
    }
  },

  onReply: async function ({ message, Reply, event, api, commandName }) {
    const { author, listRequest, messageID } = Reply;
    if (author !== event.senderID) return;
    const args = event.body.trim().toLowerCase().split(/\s+/);

    clearTimeout(Reply.unsendTimeout);

    const form = {
      av: api.getCurrentUserID(),
      fb_api_caller_class: "RelayModern",
      variables: {
        input: {
          source: "friends_tab",
          actor_id: api.getCurrentUserID(),
          client_mutation_id: Math.round(Math.random() * 19).toString()
        },
        scale: 3,
        refresh_num: 0
      }
    };

    const success = [];
    const failed = [];

    if (args[0] === "add") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestConfirmMutation";
      form.doc_id = "3147613905362928";
    }
    else if (args[0] === "del") {
      form.fb_api_req_friendly_name = "FriendingCometFriendRequestDeleteMutation";
      form.doc_id = "4108254489275063";
    }
    else {
      return api.sendMessage("❌ Invalid command. Usage: <add|del> <number|all>", event.threadID, event.messageID);
    }

    let targetIDs = args.slice(1);

    if (args[1] === "all") {
      targetIDs = Array.from({ length: listRequest.length }, (_, i) => i + 1);
    }

    const newTargetIDs = [];
    const promiseFriends = [];

    for (const stt of targetIDs) {
      const user = listRequest[parseInt(stt) - 1];
      if (!user) {
        failed.push(`🚫 Can't find request #${stt}`);
        continue;
      }
      form.variables.input.friend_requester_id = user.node.id;
      form.variables = JSON.stringify(form.variables);
      newTargetIDs.push(user);
      promiseFriends.push(api.httpPost("https://www.facebook.com/api/graphql/", form));
      form.variables = JSON.parse(form.variables);
    }

    const results = await Promise.allSettled(promiseFriends);
    
    results.forEach((result, index) => {
      const user = newTargetIDs[index];
      if (result.status === "fulfilled" && !JSON.parse(result.value).errors) {
        success.push(`✅ ${user.node.name} (${user.node.id})`);
      } else {
        failed.push(`❌ ${user.node.name} (${user.node.id})`);
      }
    });

    let replyMsg = "";
    if (success.length > 0) {
      replyMsg += `✨ Successfully ${args[0] === 'add' ? 'accepted' : 'rejected'} ${success.length} request(s):\n${success.join("\n")}\n\n`;
    }
    if (failed.length > 0) {
      replyMsg += `⚠️ Failed to process ${failed.length} request(s):\n${failed.join("\n")}`;
    }

    if (replyMsg) {
      api.sendMessage(replyMsg, event.threadID, event.messageID);
    } else {
      api.unsendMessage(messageID);
      api.sendMessage("❌ No valid requests were processed.", event.threadID);
    }

    api.unsendMessage(messageID);
  },

  onStart: async function ({ event, api, commandName }) {
    try {
      const form = {
        av: api.getCurrentUserID(),
        fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
        fb_api_caller_class: "RelayModern",
        doc_id: "4499164963466303",
        variables: JSON.stringify({ input: { scale: 3 } })
      };
      
      const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
      const listRequest = JSON.parse(response).data.viewer.friending_possibilities.edges;
      
      if (!listRequest || listRequest.length === 0) {
        return api.sendMessage("🌟 You have no pending friend requests!", event.threadID);
      }

      let msg = "📩 Pending Friend Requests:\n\n";
      listRequest.forEach((user, index) => {
        msg += `🔹 ${index + 1}. ${user.node.name}\n`;
        msg += `   🆔: ${user.node.id}\n`;
        msg += `   🔗: ${user.node.url.replace("www.facebook", "fb")}\n`;
        msg += `   ⏰: ${moment(user.time * 1009).tz("Asia/Manila").format("DD/MM/YYYY HH:mm:ss")}\n\n`;
      });

      msg += "💡 Reply with:\n"
           + "• 'add <number>' to accept a request\n"
           + "• 'del <number>' to reject a request\n"
           + "• 'add all' to accept all\n"
           + "• 'del all' to reject all\n\n"
           + "⏳ This menu will auto-delete in 2 minutes";

      api.sendMessage(msg, event.threadID, (e, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          listRequest,
          author: event.senderID,
          unsendTimeout: setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 2 * 60 * 1000) // 2 minutes
        });
      }, event.messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ An error occurred while fetching friend requests.", event.threadID);
    }
  }
};