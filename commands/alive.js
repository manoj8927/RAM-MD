'use strict';
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
function getMode() {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','messageCount.json'),'utf8'));
    return data.isPublic === false ? 'PRIVATE 🔒' : 'PUBLIC 🌍';
  } catch (_) { return 'PUBLIC 🌍'; }
}
function uptime(seconds) {
  const n = Math.floor(seconds), d=Math.floor(n/86400), h=Math.floor(n%86400/3600), m=Math.floor(n%3600/60);
  return [d&&d+'d',h&&h+'h',m&&m+'m',n%60+'s'].filter(Boolean).join(' ');
}
async function aliveCommand(sock, chatId, message) {
  const text = [
    '╭━━━〔 ⚡ *RAM-MD STATUS* 〕━━━╮',
    '┃ 🤖 '+(settings.botName || 'RAM-MD'),
    '┃ ✅ Online & Ready',
    '┃ 🔐 '+getMode(),
    '┃ ⏱️ '+uptime(process.uptime()),
    '┃ 🏷️ v'+(settings.version || '3.0.8'),
    '╰━━━━━━━━━━━━━━━━━━━━╯',
    '',
    '📚 *.menu* — command categories',
    '📥 *.menu download* — media tools',
    '🔗 '+(settings.channelLink || 'https://ram-md.blogspot.com/')
  ].join('\n');
  try { await sock.sendMessage(chatId,{text},{quoted:message}); }
  catch (error) { console.error('[alive] failed:',error?.message || error); }
}
module.exports = aliveCommand;
module.exports.getMode = getMode;
