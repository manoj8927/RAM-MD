'use strict';

const appearance = require('../lib/menuSettings');

const commandHelp = [
  '╔══『 🎨 *RAM-MD MENU SETTINGS* 』══╗',
  '║ 1. *Style*    neon / classic / minimal',
  '║ 2. *Image*    on / off',
  '║ 3. *Image URL*  custom public HTTPS',
  '║ 4. *Footer*  custom single line',
  '╚═══════════════════╝',
  '',
  '🛠️ *OWNER COMMANDS*',
  '• .menuset style neon',
  '• .menuset style classic',
  '• .menuset style minimal',
  '• .menuset image off',
  '• .menuset image on',
  '• .menuset imageurl https://example.com/menu.jpg',
  '• .menuset footer SANJOY MAHATO',
  '• .menuset reset',
  '',
  '💾 Saved under data/menuSettings.json',
].join('\n');

async function menuSettingsCommand(sock, chatId, message, raw = '', isOwner = false) {
  const reply = text => sock.sendMessage(chatId,{text},{quoted:message});
  if (!isOwner && !message?.key?.fromMe) return reply('❌ Only the bot owner or sudo can change the Menu.');
  const words = String(raw).trim().replace(/^\.menuset\b\s*/i,'');
  const [key, ...remaining] = words.split(/\s+/);
  const value = remaining.join(' ').trim();
  if (!key || key === 'show' || key === 'help') {
    const cfg = appearance.read();
    return reply(commandHelp+'\n\n*Current:* '+cfg.style+
      ' | Picture: '+(cfg.imageEnabled?'ON':'OFF')+
      '\nFooter: '+cfg.footer);
  }
  try {
    if (key === 'reset') {
      appearance.reset();
      return reply('✅ Menu settings reset to defaults. Use *.menu* to preview.');
    }
    if (key === 'style') appearance.update('style',value.toLowerCase());
    else if (key === 'image') {
      if (!['on','off'].includes(value.toLowerCase())) throw new Error('Usage: .menuset image on/off');
      appearance.update('imageEnabled',value.toLowerCase()==='on');
    } else if (key === 'imageurl') appearance.update('imageUrl',value);
    else if (key === 'footer') appearance.update('footer',value);
    else return reply('❌ Unknown setting.\n\n'+commandHelp);
    return reply('✅ Menu '+key+' updated. Type *.menu* to preview.\n💾 Saved across restarts.');
  } catch (e) {
    return reply('❌ '+e.message);
  }
}
module.exports = menuSettingsCommand;
