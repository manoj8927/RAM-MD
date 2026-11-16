const REPOSITORY_URL = 'https://github.com/manoj8927/RAM-MD';
const REPOSITORY_IMAGE_URL = 'https://raw.githubusercontent.com/manoj8927/IMG-url/main/manu.jpg';

async function githubCommand(sock, chatId, message) {
  try {
    let txt = `*乂  『ＲＡＭ－ＭＤ』⚡  乂*\n\n`;
    txt += `✩  *Name* : RAM-MD\n`;
    txt += `✩  *Owner* : 𝗦𝗮𝗻𝗷𝗼𝘆 𝗧𝗲𝗰𝗵𝗫 ⚡\n`;
    txt += `✩  *Repository* : Private\n`;
    txt += `✩  *URL* : ${REPOSITORY_URL}\n\n`;
    txt += `💥 *『ＲＡＭ－ＭＤ』⚡*`;

    await sock.sendMessage(chatId, { image: { url: REPOSITORY_IMAGE_URL }, caption: txt }, { quoted: message });
  } catch (error) {
    await sock.sendMessage(chatId, { text: '❌ Error fetching repository information.' }, { quoted: message });
  }
}

module.exports = githubCommand; 
