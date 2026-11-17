require('dotenv').config();

const settings = {
  packname: '『ＲＡＭ－ＭＤ』⚡',
  author: '‎',
  botName: "『ＲＡＭ－ＭＤ』⚡",
  botOwner: '𝗦𝗮𝗻𝗷𝗼𝘆 𝗧𝗲𝗰𝗵𝗫 ⚡', // Your name
  ownerNumber: '917047294917', //Set your number here without + symbol, just add country code & number without any space
  giphyApiKey: 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  channelLink: 'https://whatsapp.com/channel/0029Vb8ixxHHVvTjIhDSHd01',
  channelJid: '120363413703815929@newsletter',
  menuImageUrl: 'https://raw.githubusercontent.com/manoj8927/IMG-url/main/manu.jpg',
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "3.0.8",
  updateZipUrl: "https://github.com/mruniquehacker/Knightbot-MD/archive/refs/heads/main.zip",
  // Media / Knight API (song, video, cards, etc.)
  knightApiUrl: process.env.KNIGHT_API_URL || 'https://knightbotapi.stream',
  knightApiKey: process.env.KNIGHT_API_KEY || 'knight',
  mediaApiUrl: process.env.MEDIA_API_URL || 'https://knightbotapi.stream',
  mediaApiKey: process.env.MEDIA_API_KEY || 'knight',
  princeApiUrl: process.env.PRINCE_API_URL || 'https://api.princetechn.com',
  princeApiKey: process.env.PRINCE_API_KEY || 'prince',
};

module.exports = settings;
