const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");
const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

const fancyFontMap = {
  'A': '𝙰', 'B': '𝙱', 'C': '𝙲', 'D': '𝙳', 'E': '𝙴', 'F': '𝙵', 'G': '𝙶', 'H': '𝙷', 'I': '𝙸', 'J': '𝙹', 'K': '𝙺', 'L': '𝙻', 'M': '𝙼', 'N': '𝙽', 'O': '𝙾', 'P': '𝙿', 'Q': '𝚀', 'R': '𝚁', 'S': '𝚂', 'T': '𝚃', 'U': '𝚄', 'V': '𝚅', 'W': '𝚆', 'X': '𝚇', 'Y': '𝚈', 'Z': '𝚉',
  'a': '𝚊', 'b': '𝚋', 'c': '𝚌', 'd': '𝚍', 'e': '𝚎', 'f': '𝚏', 'g': '𝚐', 'h': '𝚑', 'i': '𝚒', 'j': '𝚓', 'k': '𝚔', 'l': '𝚕', 'm': '𝚖', 'n': '𝚗', 'o': '𝚘', 'p': '𝚙', 'q': '𝚚', 'r': '𝚛', 's': '𝚜', 't': '𝚝', 'u': '𝚞', 'v': '𝚟', 'w': '𝚠', 'x': '𝚡', 'y': '𝚢', 'z': '𝚣',
  '0': '𝟶', '1': '𝟷', '2': '𝟸', '3': '𝟹', '4': '𝟺', '5': '𝟻', '6': '𝟼', '7': '𝟽', '8': '𝟾', '9': '𝟿',
  ' ': ' ', ',': ',', '.': '.', '!': '!', '?': '?', '-': '-', '': '', '(': '(', ')': ')', '[': '[', ']': ']', '{': '{', '}': '}',
  '\n': '\n'
};

function toFancyFont(text) {
  return text.split('').map(char => fancyFontMap[char] || char).join('');
}

module.exports = {
  config: {
    name: "help",
    version: "2.1",
    author: "Hopeless Nil",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "Elegant help menu with detailed command info",
    },
    longDescription: {
      en: "View the list of all available commands and get detailed usage info for a specific command.",
    },
    category: "info",
    guide: {
      en: "{pn} [command name] or {pn} c <category_name>",
    },
    priority: 1,
  },

  onStart: async function ({ message, args, event, threadsData, role }) {
    const { threadID } = event;
    const threadData = await threadsData.get(threadID);
    const prefix = getPrefix(threadID);

    // Handle category view
    if (args[0] && (args[0].toLowerCase() === 'c' || args[0].toLowerCase() === 'category') && args[1]) {
      const categoryName = args.slice(1).join(' ').toLowerCase();
      const categories = {};

      // Get all commands accessible to user's role
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category?.en || value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      // Find the category (case-insensitive)
      const categoryKey = Object.keys(categories).find(
        cat => cat.toLowerCase() === categoryName
      );

      if (!categoryKey) {
        const availableCategories = Object.keys(categories).sort().join(', ');
        return await message.reply(
          `❌ Category "${categoryName}" not found.\n\n` +
          `Available categories:\n${availableCategories}\n\n` +
          `Use "${prefix}help" to see all categories.`
        );
      }

      const categoryCommands = categories[categoryKey].commands.sort();

      let msg = 
        `╔══════════════════════════╗\n` +
        `║    🎀  ${toFancyFont(categoryKey.toUpperCase())} 🎀    ║\n` +
        `╚══════════════════════════╝\n\n` +
        `𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${categoryKey}\n` +
        `𝗣𝗿𝗲𝗳𝗶𝘅: ${prefix}\n` +
        `▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n\n`;

      // Display commands in a grid format
      const commandsPerLine = 3;
      for (let i = 0; i < categoryCommands.length; i += commandsPerLine) {
        const lineCommands = categoryCommands.slice(i, i + commandsPerLine);
        const line = lineCommands.map(cmd => `• ${cmd}`).join('     ');
        msg += `${line}\n`;
      }

      msg += `\n📦 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${categoryCommands.length}`;
      msg += `\n📖 𝗨𝘀𝗮𝗴𝗲: ${prefix}help <command>`;
      msg += `\n   to view details of a specific command.\n`;
      msg += `\n✨ 𝗗𝗲𝘃: 𝗛𝗼𝗽𝗲𝗹𝗲𝘀𝘀 𝗡𝗶𝗹 ✨`;

      return await message.reply(msg);
    }

    if (!args.length) {
      const categories = {};
      let msg = `╔═══════════════════╗\n` +
        `║    🎀 𝗣𝗢𝗢𝗞𝗜𝗘𝗘 𝗕𝗢𝗧 🎀    ║\n` +
        `╚═══════════════════╝\n\n` +
        `𝗛𝗲𝗹𝗽 𝗠𝗲𝗻𝘂 | 𝗣𝗿𝗲𝗳𝗶𝘅: [ ${prefix} ]\n` +
        `▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n\n`;

      // Get all commands accessible to user's role
      for (const [name, value] of commands) {
        if (value.config.role > 1 && role < value.config.role) continue;
        const category = value.config.category?.en || value.config.category || "Uncategorized";
        categories[category] = categories[category] || { commands: [] };
        categories[category].commands.push(name);
      }

      // Sort categories alphabetically
      const sortedCategories = Object.keys(categories).sort();

      // Display categories except "info" first
      for (const category of sortedCategories) {
        if (category.toLowerCase() !== "info") {
          msg += `\n╭─❏ ${toFancyFont(category.toUpperCase())}\n`;

          const names = categories[category].commands.sort();
          let line = "";

          for (let i = 0; i < names.length; i++) {
            if (i % 4 === 0 && i !== 0) {
              msg += `│ ${line}\n`;
              line = "";
            }
            line += `• ${names[i]}  `;
          }

          if (line) {
            msg += `│ ${line}\n`;
          }
          msg += `╰───────────◎\n`;
        }
      }

      // Add info category at the end if it exists
      if (categories.info) {
        msg += `\n╭─❏ ${toFancyFont("INFO")}\n`;

        const names = categories.info.commands.sort();
        let line = "";

        for (let i = 0; i < names.length; i++) {
          if (i % 4 === 0 && i !== 0) {
            msg += `│ ${line}\n`;
            line = "";
          }
          line += `• ${names[i]}  `;
        }

        if (line) {
          msg += `│ ${line}\n`;
        }
        msg += `╰───────────◎\n`;
      }

      const totalCommands = Object.values(categories).reduce((acc, cat) => acc + cat.commands.length, 0);

      msg += `\n📦 𝗧𝗼𝘁𝗮𝗹 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: ${totalCommands}`;
      msg += `\n📖 𝗨𝘀𝗮𝗴𝗲: ${prefix}help <command>`;
      msg += `\n   to view details of that command.`;
      msg += `\n📖 𝗨𝘀𝗮𝗴𝗲: ${prefix}help c <category>`;
      msg += `\n   to view all commands in a category.\n`;
      msg += `\n✨ 𝗗𝗲𝘃: 𝗛𝗼𝗽𝗲𝗹𝗲𝘀𝘀 𝗡𝗶𝗹 ✨`;

      const helpListImages = [
        "https://i.postimg.cc/8cvDpt37/images-17.jpg",
        "https://i.postimg.cc/qq2VVghn/received-430815183006013.jpg",
        "https://i.postimg.cc/KzRxVZDr/received-455361183700405.jpg",
        "https://i.postimg.cc/MGZW70cL/received-435752262736007.jpg",
        "https://i.postimg.cc/Pq6d2LY5/received-3200033873462285.jpg",
      ];

      const helpListImage = helpListImages[Math.floor(Math.random() * helpListImages.length)];

      try {
        await message.reply({
          body: msg,
          attachment: await global.utils.getStreamFromURL(helpListImage)
        });
      } catch (error) {
        // If image fails to load, send text only
        await message.reply(msg);
      }

    } else {
      const commandName = args[0].toLowerCase();
      const command = commands.get(commandName) || commands.get(aliases.get(commandName));

      if (!command) {
        await message.reply(`❌ Command "${commandName}" not found. Use ${prefix}help to see all commands.`);
      } else {
        // Check if user has permission for this command
        if (command.config.role > 1 && role < command.config.role) {
          return await message.reply("⚠️ You don't have permission to use this command.");
        }

        const configCommand = command.config;
        const roleText = roleTextToString(configCommand.role);
        const author = configCommand.author || "Unknown";
        const description = configCommand.shortDescription?.en || configCommand.longDescription?.en || "No description available.";
        const longDescription = configCommand.longDescription?.en || description;
        const guideBody = configCommand.guide?.en || "No guide available.";
        const usage = guideBody.replace(/{pn}/g, prefix + configCommand.name).replace(/{p}/g, prefix);
        const aliasesList = configCommand.aliases ? configCommand.aliases.join(", ") : "None";

        const response =
          `╔══════════════════════╗\n` +
          `║    🎀 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 🎀    ║\n` +
          `╚══════════════════════╝\n\n` +
          `❖ 𝗡𝗮𝗺𝗲: ${configCommand.name}\n` +
          `❖ 𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${description}\n\n` +
          `📋 𝗗𝗲𝘁𝗮𝗶𝗹𝘀:\n` +
          `• 𝗔𝗹𝗶𝗮𝘀𝗲𝘀: ${aliasesList}\n` +
          `• 𝗔𝘂𝘁𝗵𝗼𝗿: ${author}\n` +
          `• 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${configCommand.version || "1.0"}\n` +
          `• 𝗥𝗼𝗹𝗲: ${roleText}\n` +
          `• 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${configCommand.countDown || 1}s\n\n` +
          `📖 𝗨𝘀𝗮𝗴𝗲:\n${usage}\n\n` +
          `📝 𝗡𝗼𝘁𝗲𝘀:\n${longDescription}\n\n` +
          `▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n` +
          `🌟 𝗕𝗼𝘁 𝗯𝘆: 𝗛𝗼𝗽𝗲𝗹𝗲𝘀𝘀 𝗡𝗶𝗹`;

        await message.reply(response);
      }
    }
  },
};

function roleTextToString(roleText) {
  switch (roleText) {
    case 0: return "0 (All users)";
    case 1: return "1 (Group admins)";
    case 2: return "2 (Bot admins)";
    default: return "Unknown role";
  }
}