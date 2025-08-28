const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "delete",
    aliases: ["d"],
    version: "2.0",
    author: "xnil",
    dev: true,
    countDown: 2,
    role: 2,
    category: "utility",
    shortDescription: "Delete files & clean system",
    longDescription: "Stylish delete command to clean cache, temp files or specific files.",
    guide: {
      en: "{pn} (Clean cache & temp files)\n{pn} <file.js> (Delete specific command)\n{pn} images (Delete downloaded images)"
    },
  },
  
  onStart: async function({ args, api, event }) {
    const directoriesToDelete = ['cache', 'tmp'];
    const fileName = args[0];
    
    try {
      // 🔹 Delete Downloaded Images
      if (fileName === "images") {
        const imagesFolder = path.join('downloads', 'images');
        
        if (!fs.existsSync(imagesFolder)) {
          return api.sendMessage("❌ | 'downloads/images' folder does not exist.", event.threadID);
        }
        
        const imageFiles = fs.readdirSync(imagesFolder);
        if (imageFiles.length === 0) {
          return api.sendMessage("🚫 | 'downloads/images' is already empty.", event.threadID);
        }
        
        for (const img of imageFiles) {
          fs.unlinkSync(path.join(imagesFolder, img));
        }
        
        return api.sendMessage(
          `🖼️ | Deleted *${imageFiles.length} images* from 'downloads/images' ✅`,
          event.threadID
        );
      }
      
      // 🔹 Delete Specific File
      else if (fileName) {
        const filePath = path.join(__dirname, fileName);
        
        if (!fs.existsSync(filePath)) {
          return api.sendMessage(`❌ | File *${fileName}* not found.`, event.threadID);
        }
        
        fs.unlinkSync(filePath);
        return api.sendMessage(`🗑️ | File *${fileName}* deleted successfully ✅`, event.threadID);
      }
      
      // 🔹 Clean Cache & Temp
      else {
        let totalDeleted = 0;
        let deletedFiles = [];
        
        for (const dir of directoriesToDelete) {
          const dirPath = path.join(__dirname, dir);
          if (!fs.existsSync(dirPath)) continue;
          
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
              deletedFiles.push(`${dir}/${file}`);
              totalDeleted++;
            }
          }
        }
        
        if (totalDeleted === 0) {
          return api.sendMessage("🚫 | No cache or temp files found to delete.", event.threadID);
        }
        
        return api.sendMessage(
          `🧹 | Cleanup completed!\n\n✅ Deleted *${totalDeleted} files*:\n${deletedFiles.map(f => "• " + f).join("\n")}`,
          event.threadID
        );
      }
    } catch (err) {
      console.error(err);
      return api.sendMessage(`❌ | Error occurred: ${err.message}`, event.threadID);
    }
  }
};