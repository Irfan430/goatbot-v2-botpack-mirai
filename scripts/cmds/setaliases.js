const axios = require("axios");

module.exports = {
  config: {
    name: "setaliases",
    aliases: ["setal", "aliasfix"],
    version: "1.0",
    author: "xnil6x",
    countDown: 10,
    role: 2,
    shortDescription: {
      en: "Set or update aliases of commands"
    },
    longDescription: {
      en: "Allows bot owner to update the 'aliases' field in specific or all command files in GitHub repository"
    },
    category: "owner",
    guide: {
      en: "{prefix}setaliases <filename|all> | <alias1,alias2,...>\n\nExample:\n- {prefix}setaliases uptime | up,upt,uptime"
    }
  },

  langs: {
    en: {
      unauthorized: "🚫 Only the bot owner can use this command.",
      invalidFormat: "❗ Invalid format.\nUse: setaliases <filename|all> | <alias1,alias2,...>",
      notFound: "❌ No matching file(s) found.",
      start: "🔧 Updating aliases for: %1...",
      done: "✅ Alias update complete!\n\n✅ Updated: %1\n❌ Failed: %2",
      error: "⚠️ GitHub Error: %1"
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

    if (event.senderID !== OWNER_ID)
      return message.reply(getLang("unauthorized"));

    const input = args.join(" ").split("|").map(s => s.trim());
    if (input.length !== 2 || !input[0] || !input[1])
      return message.reply(getLang("invalidFormat"));

    const target = input[0];
    const aliasList = input[1].split(",").map(a => a.trim()).filter(Boolean);

    if (aliasList.length === 0)
      return message.reply(getLang("invalidFormat"));

    message.reply(getLang("start", target));

    const headers = {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "SetAliasesBot"
    };

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

    const getFileContent = async (path) => {
      const url = `https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${path}`;
      const res = await axios.get(url, { headers });
      const content = Buffer.from(res.data.content, "base64").toString("utf-8");
      return { content, sha: res.data.sha };
    };

    const updateAliases = async (file) => {
      try {
        const { content, sha } = await getFileContent(file.path);
        const aliasesFormatted = JSON.stringify(aliasList);

        // Replace or insert aliases
        let updatedContent;
        if (content.includes("aliases:")) {
          updatedContent = content.replace(/aliases:\s*\[[^\]]*?\]/, `aliases: ${aliasesFormatted}`);
        } else {
          updatedContent = content.replace(/(config:\s*{)/, `$1\n    aliases: ${aliasesFormatted},`);
        }

        if (updatedContent === content) return false;

        const encoded = Buffer.from(updatedContent, "utf-8").toString("base64");

        await axios.put(`https://api.github.com/repos/${REPO.owner}/${REPO.name}/contents/${file.path}`, {
          message: `chore: updated aliases in ${file.name}`,
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
        return message.reply(getLang("notFound"));

      const updated = [];
      const failed = [];

      for (const file of selectedFiles) {
        const success = await updateAliases(file);
        if (success) updated.push(file.name);
        else failed.push(file.name);
      }

      const msg = [
        `📦 𝗔𝗹𝗶𝗮𝘀 𝗨𝗽𝗱𝗮𝘁𝗲 𝗥𝗲𝗽𝗼𝗿𝘁`,
        `────────────────────────────`,
        `✅ Updated (${updated.length}):`,
        updated.map(f => `  └─ 📄 ${f}`).join("\n") || "  └─ None",
        ``,
        `❌ Failed (${failed.length}):`,
        failed.map(f => `  └─ 📂 ${f}`).join("\n") || "  └─ None"
      ].join("\n");

      return message.reply(msg);

    } catch (err) {
      console.error("GitHub API Error:", err);
      return message.reply(getLang("error", err.response?.data?.message || err.message));
    }
  }
};
