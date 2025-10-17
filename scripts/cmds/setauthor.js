const axios = require("axios");

module.exports = {
  config: {
    name: "setauthor",
    aliases: ["seta", "authorfix"],
    version: "1.1",
    author: "xnil6x",
    countDown: 10,
    role: 2,
    shortDescription: {
      en: "Change author field in commands"
    },
    longDescription: {
      en: "Mass update or individually update the 'author' field in your command files to 'xnil6x'."
    },
    category: "owner",
    guide: {
      en: "{prefix}setauthor <filename|all>\n\n📌 Example:\n- {prefix}setauthor all\n- {prefix}setauthor uptime"
    }
  },

  langs: {
    en: {
      unauthorized: "🚫 Only the bot owner can use this command.",
      invalidFile: "❗ Please provide a valid filename or use 'all'.",
      start: "🛠 Starting author update for: %1...",
      done: "✅ Author update completed.\n\n✅ Success: %1\n❌ Failed: %2",
      error: "⚠️ GitHub API Error: %1"
    }
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    const OWNER_ID = "100001986888287";
    const GITHUB_TOKEN = "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";
    const REPO = {
      owner: "X-nil143",
      name: "GB",
      branch: "main",
      path: "scripts/cmds"
    };
    const TARGET_AUTHOR = "xnil6x";

    if (event.senderID !== OWNER_ID) return message.reply(getLang("unauthorized"));
    const target = args[0];
    if (!target) return message.reply(getLang("invalidFile"));

    message.reply(getLang("start", target));

    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SetAuthorBot"
    };

    // Fetch all .js files in the command directory
    const getAllFiles = async () => {
      const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${REPO.path}?ref=${REPO.branch}`;
      const res = await axios.get(url, { headers });
      return res.data
        .filter(file => file.name.endsWith(".js"))
        .map(file => ({
          name: file.name,
          path: file.path,
          sha: file.sha
        }));
    };

    // Get file content
    const getFileContent = async (path) => {
      const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`;
      const res = await axios.get(url, { headers });
      const content = Buffer.from(res.data.content, "base64").toString("utf-8");
      return { content, sha: res.data.sha };
    };

    // Update author in the file content and commit
    const updateAuthor = async (file) => {
      try {
        const { content, sha } = await getFileContent(file.path);

        // Replace author line
        const updated = content.replace(/author:\s*["'`].*?["'`]/, `author: "${TARGET_AUTHOR}"`);
        if (updated === content) return false; // No change

        const encoded = Buffer.from(updated, "utf-8").toString("base64");

        await axios.put(`https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${file.path}`, {
          message: `updated author in ${file.name}`,
          content: encoded,
          sha: sha,
          branch: REPO.branch,
          committer: {
            name: "X-nil143",
            email: "xnilxhowdhury@gmail.com"
          }
        }, { headers });

        return true;
      } catch (err) {
        console.error(`❌ ${file.name}:`, err.message);
        return false;
      }
    };

    try {
      const allFiles = await getAllFiles();

      const selectedFiles = target.toLowerCase() === "all"
        ? allFiles
        : allFiles.filter(f => f.name.toLowerCase() === `${target.toLowerCase()}.js`);

      if (selectedFiles.length === 0)
        return message.reply(getLang("invalidFile"));

      const updated = [];
      const failed = [];

      for (const file of selectedFiles) {
        const success = await updateAuthor(file);
        if (success) updated.push(file.name);
        else failed.push(file.name);
      }

      const msg = [
        `🎯 𝗔𝘂𝘁𝗵𝗼𝗿 𝗨𝗽𝗱𝗮𝘁𝗲 𝗥𝗲𝗽𝗼𝗿𝘁`,
        `────────────────────────────`,
        `✅ Updated Files: (${updated.length})`,
        updated.map(f => `  └─ 📄 ${f}`).join("\n") || "  └─ None",
        ``,
        `❌ Failed Files: (${failed.length})`,
        failed.map(f => `  └─ 📂 ${f}`).join("\n") || "  └─ None"
      ].join("\n");

      return message.reply(msg);

    } catch (err) {
      console.error("GitHub API Error:", err);
      return message.reply(getLang("error", err.response?.data?.message || err.message));
    }
  }
};
