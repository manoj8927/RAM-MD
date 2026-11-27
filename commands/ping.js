'use strict';
const settings = require('../settings');
function uptime(seconds) {
 const s=Math.floor(seconds),d=Math.floor(s/86400),h=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);
 return [d&&d+'d',h&&h+'h',m&&m+'m',s%60+'s'].filter(Boolean).join(' ');
}
async function pingCommand(sock,chatId,message) {
  const start=Date.now();
  // This measures command processing time, not network round-trip latency.
  const result=[
    '╭━━━〔 ⚡ *RAM-MD PING* 〕━━━╮',
    '┃ 🟢 Bot: Online',
    '┃ ⚙️ Processing: '+(Date.now()-start)+'ms',
    '┃ ⏱️ Uptime: '+uptime(process.uptime()),
    '┃ 🏷️ Version: v'+(settings.version||'3.0.8'),
    '╰━━━━━━━━━━━━━━━━━━━━╯'
  ].join('\n');
  try { return await sock.sendMessage(chatId,{text:result},{quoted:message}); }
  catch(error){ console.error('[ping] unable to send:',error?.message||error); }
}
module.exports=pingCommand;
