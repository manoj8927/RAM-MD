// RAM-MD Free Fire player information command
// Configure FFINFO_API_URL with a trusted HTTPS JSON endpoint accepting ?uid=...
const axios = require('axios');

module.exports = async function ffinfoCommand(sock, chatId, uid, message) {
  const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: message });
  uid = String(uid || '').trim();
  if (!/^\d{6,15}$/.test(uid)) return reply('🎮 Usage: .ffinfo 19191758817');
  if (!process.env.FFINFO_API_URL) return reply('⚠️ FFINFO_API_URL is not configured by the bot owner.');
  try {
    const url = new URL(process.env.FFINFO_API_URL);
    if (url.protocol !== 'https:') return reply('⚠️ FFINFO_API_URL must use HTTPS.');
    url.searchParams.set('uid', uid);
    const response = await axios.get(url.toString(), {
      timeout: 10000,
      headers: process.env.FFINFO_API_KEY ? { Authorization: 'Bearer ' + process.env.FFINFO_API_KEY } : {},
      maxContentLength: 1000000
    });
    const root = response.data || {};
    const data = root.data || root.player || root;
    if (root.success === false || !data || typeof data !== 'object') return reply('❌ Player information not found.');
    const field = (...keys) => {
      for (const k of keys) {
        const value = data[k];
        if (value !== undefined && value !== null && value !== '' && typeof value !== 'object') return String(value);
      }
      return 'N/A';
    };
    return reply('🎮 *FREE FIRE PLAYER INFO*\n\n' +
      '🆔 UID: ' + uid + '\n' +
      '👤 Name: ' + field('nickname', 'name', 'playerName') + '\n' +
      '🌍 Region: ' + field('region', 'server') + '\n' +
      '⭐ Level: ' + field('level', 'playerLevel') + '\n' +
      '❤️ Likes: ' + field('likes', 'liked') + '\n' +
      '🏆 BR Rank: ' + field('brRank', 'rank') + '\n' +
      '⚔️ CS Rank: ' + field('csRank') + '\n\n⚡ Powered by RAM-MD');
  } catch (err) {
    return reply('❌ Unable to fetch player info. Check the API configuration or try later.');
  }
};
