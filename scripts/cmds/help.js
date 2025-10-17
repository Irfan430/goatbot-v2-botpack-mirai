const boldText = (text) => {
  const boldMap = {
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚',
    'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡',
    'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨',
    'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴',
    'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻',
    'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂',
    'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲',
    '7': '𝟳', '8': '𝟴', '9': '𝟵'
  };
  return text.split('').map(c => boldMap[c] || c).join('');
};

module.exports = {
  config: {
    name: "help",
    aliases: ["menu", "h"],
    version: "4.5",
    author: "xnil6x",
    usePrefix: true,
    role: 0,
    description: "Display all available commands",
    category: "system",
    guide: {
      en: "{pn} [command name]"
    }
  },

  onStart: async function ({ message, args, prefix }) {
    const allCommands = global.GoatBot.commands;
    const botName = global.GoatBot.config.nickNameBot || "YourBot";

    if (!args[0]) {
      const categories = {};
      for (const [name, cmd] of allCommands) {
        const cat = cmd.config.category?.toLowerCase() || "uncategorized";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(name);
      }

      const sortedCats = Object.keys(categories).sort();
      let menu = `✨ ${boldText("COMMAND MENU")} ✨\n\n`;

      for (const cat of sortedCats) {
        const boldCat = boldText(cat.charAt(0).toUpperCase() + cat.slice(1));
        const cmds = categories[cat].sort();
        menu += `🔸 ${boldCat}\n`;
        menu += `   ${cmds.map(cmd => `🔹 ${cmd}`).join(' ')}\n\n`;
      }

      menu += `╭────────[ ℹ️ ${boldText("INFO")} ]────────╮\n`;
      menu += `│ 🤖 ${boldText("Bot")}: ${botName}\n`;
      menu += `│ 🔣 ${boldText("Prefix")}: ${prefix}\n`;
      menu += `│ 📦 ${boldText("Total")}: ${allCommands.size} ${boldText("commands")}\n`;
      menu += `│ 📘 ${boldText("Usage")}: ${prefix}help [command]\n`;
      menu += `╰──────────────────────────╯`;

      return message.reply(menu);
    }

    // Detail view
    const query = args[0].toLowerCase();
    const cmd = allCommands.get(query) || [...allCommands.values()].find(c => c.config.aliases?.includes(query));
    if (!cmd) return message.reply(`❌ Command "${query}" not found.`);

    const { name, description, category, aliases, guide, author, usePrefix, role, version } = cmd.config;

    const roleMap = {  
  0: "👥 Everyone",  
  1: "👑 Group Admins",  
  2: "🤖 Bot Admins",  
  3: "🌟 Premium",  
  4: "💻 Dev Only"  
};  

    const usage = guide?.en?.replace(/{pn}/g, prefix + name).replace(/{p}/g, prefix) || `${prefix}${name}`;

    let detail = `╔═[ 🔍 ${boldText("Command Info")}: ${boldText(name)} ]═╗\n`;
    detail += `║ 📖 ${boldText("Description")}: ${description || "No description"}\n`;
    detail += `║ 📂 ${boldText("Category")}: ${category || "Uncategorized"}\n`;
    detail += `║ 🔁 ${boldText("Aliases")}: ${aliases?.join(", ") || "None"}\n`;
    detail += `║ 🧪 ${boldText("Version")}: v${version || "1.0"}\n`;
    detail += `║ 👤 ${boldText("Author")}: ${author || "Unknown"}\n`;
    detail += `🔒 ${boldText("Permission")}: ${roleMap[role] || "Custom"}\n`;
    detail += `║ 🧷 ${boldText("Usage")}: ${usage}\n`;
    detail += `╚════════════════════════════╝`;

    return message.reply(detail);
  }
};
