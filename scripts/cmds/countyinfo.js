const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "countryinfo",
    aliases: ["cinfo"],
    version: "2.0",
    author: "xnil6x",
    category: "info",
    description: "Get detailed information about a country",
    guide: "{pn} [country name]"
  },

  onStart: async function ({ api, event, args }) {
    const query = args.join(" ");

    if (!query) {
      return api.sendMessage("❌ Please provide a country name!", event.threadID, event.messageID);
    }

    try {
      const response = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(query)}?fullText=false`);

      if (response.data && response.data.length > 0) {
        const country = response.data[0];

        const name = country.name?.common || "N/A";
        const official = country.name?.official || "N/A";
        const capital = country.capital ? country.capital.join(", ") : "N/A";
        const population = country.population?.toLocaleString("en-US") || "N/A";
        const region = country.region || "N/A";
        const subregion = country.subregion || "N/A";
        const languages = country.languages ? Object.values(country.languages).join(", ") : "N/A";
        const currency = country.currencies ? Object.values(country.currencies).map(c => `${c.name} (${c.symbol})`).join(", ") : "N/A";
        const timezone = country.timezones ? country.timezones.join(", ") : "N/A";
        const borders = country.borders ? country.borders.join(", ") : "None";
        const area = country.area ? `${country.area.toLocaleString("en-US")} km²` : "N/A";
        const flagImg = country.flags?.png || country.flags?.svg;
        const maps = country.maps?.googleMaps || "N/A";

        let message = 
`🌍 Country Information 🌍

🏴 Name: ${name}
📜 Official: ${official}
🏛 Capital: ${capital}
👥 Population: ${population}
🌐 Region: ${region} (${subregion})
🗣 Languages: ${languages}
💰 Currency: ${currency}
⏰ Timezones: ${timezone}
📏 Area: ${area}
🛣 Borders: ${borders}
📍 Maps: ${maps}
`;

        if (flagImg) {
          const flagPath = path.join(__dirname, "tmp", `${name}_flag.png`);
          if (!fs.existsSync(path.join(__dirname, "tmp"))) {
            fs.mkdirSync(path.join(__dirname, "tmp"));
          }

          const imgData = await axios.get(flagImg, { responseType: "arraybuffer" });
          fs.writeFileSync(flagPath, Buffer.from(imgData.data, "binary"));

          return api.sendMessage(
            {
              body: message,
              attachment: fs.createReadStream(flagPath)
            },
            event.threadID,
            event.messageID
          );
        } else {
          return api.sendMessage(message, event.threadID, event.messageID);
        }

      } else {
        api.sendMessage("❌ No matching country found.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.error("Error fetching country info:", error);
      api.sendMessage("⚠️ Error retrieving country information!", event.threadID, event.messageID);
    }
  }
};