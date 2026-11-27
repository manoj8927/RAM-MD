'use strict';

const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const appearance = require('../lib/menuSettings');

const CATEGORIES = [
  { key: 'general', icon: '🌐', label: 'GENERAL', commands: [
    '.ping', '.alive', '.owner', '.weather <city>', '.news', '.fact', '.quote',
    '.joke', '.lyrics <song>', '.tts <text>', '.trt <text> <lang>',
    '.ss <URL>', '.github', '.jid', '.url', '.groupinfo', '.staff'
  ]},
  { key: 'group', icon: '👥', label: 'GROUP & ADMIN', commands: [
    '.tag <message>', '.tagall', '.tagnotadmin', '.hidetag <text>',
    '.kick @user', '.promote @user', '.demote @user', '.ban @user', '.unban @user',
    '.mute <minutes>', '.unmute', '.delete', '.clear',
    '.warn @user', '.warnings @user', '.antilink', '.antibadword',
    '.antitag on/off', '.antibot on/off', '.welcome on/off', '.goodbye on/off',
    '.chatbot on/off', '.resetlink', '.setgname <name>', '.setgdesc <text>',
    '.setgpp', '.groupstatus'
  ]},
  { key: 'download', icon: '📥', label: 'DOWNLOAD', commands: [
    '.play <song>', '.song <song>', '.music <song>', '.spotify <query>',
    '.video <query>', '.ytmp4 <URL>', '.instagram <URL>', '.facebook <URL>',
    '.twitter <URL>', '.tiktok <URL>', '.igs <URL>', '.igsc <URL>',
    '.ramapi', '.ramdl <public URL>'
  ]},
  { key: 'media', icon: '🎨', label: 'STICKER & MEDIA', commands: [
    '.sticker', '.simage', '.crop', '.take <name>', '.attp <text>',
    '.emojimix <emoji+emoji>', '.tgsticker <URL>', '.blur', '.remini',
    '.removebg', '.vv', '.vv2', '.meme'
  ]},
  { key: 'ai', icon: '🤖', label: 'AI', commands: [
    '.ai <question>', '.gpt <question>', '.gemini <question>',
    '.imagine <prompt>', '.flux <prompt>', '.sora <prompt>'
  ]},
  { key: 'games', icon: '🎮', label: 'GAMES', commands: [
    '.ttt', '.move <1-9>', '.surrender', '.hangman', '.guess <letter>',
    '.trivia', '.answer <answer>', '.truth', '.dare', '.8ball <question>'
  ]},
  { key: 'fun', icon: '🎉', label: 'FUN', commands: [
    '.compliment', '.insult', '.flirt', '.shayari', '.goodnight',
    '.roseday', '.character', '.wasted', '.ship', '.simp', '.stupid'
  ]},
  { key: 'text', icon: '🔠', label: 'TEXT EFFECTS', commands: [
    '.metallic <text>', '.ice <text>', '.snow <text>', '.impressive <text>',
    '.matrix <text>', '.light <text>', '.neon <text>', '.devil <text>',
    '.purple <text>', '.thunder <text>', '.leaves <text>', '.1917 <text>',
    '.arena <text>', '.hacker <text>', '.sand <text>', '.blackpink <text>',
    '.glitch <text>', '.fire <text>'
  ]},
  { key: 'anime', icon: '🌸', label: 'ANIME & IMAGES', commands: [
    '.nom', '.poke', '.cry', '.kiss', '.pat', '.hug', '.wink',
    '.facepalm', '.pies <country>', '.china', '.indonesia',
    '.japan', '.korea'
  ]},
  { key: 'owner', icon: '👑', label: 'OWNER & SETTINGS', owner: true, commands: [
    '.settings', '.menuset', '.mode public/private', '.areact on/off',
    '.autostatus on/off', '.savestatus on/off', '.autoread on/off',
    '.autotyping on/off', '.anticall on/off', '.pmblocker on/off',
    '.antidelete', '.cleartmp', '.clearsession', '.setpp', '.sudo',
    '.update', '.mention on/off', '.setmention'
  ]}
];

const ALIASES = {
  downloads: 'download', downloader: 'download', dl: 'download',
  groups: 'group', admin: 'group', moderation: 'group',
  stickers: 'media', sticker: 'media', image: 'media',
  game: 'games', funs: 'fun', effects: 'text', textmaker: 'text',
  tools: 'general', utility: 'general', settings: 'owner', anime: 'anime'
};

function available(isOwner) { return CATEGORIES.filter(group => !group.owner || isOwner); }
function mode() {
  try {
    const obj = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'messageCount.json'), 'utf8'));
    return obj.isPublic === false ? 'PRIVATE 🔒' : 'PUBLIC 🌍';
  } catch (_) { return 'PUBLIC 🌍'; }
}
function safe(value, max = 100) {
  return String(value ?? '').replace(/[\r\n*\x00-\x1f]/g, ' ').trim().slice(0,max);
}
function uptime() {
  const total = Math.floor(process.uptime());
  const d = Math.floor(total / 86400), h = Math.floor(total % 86400 / 3600);
  const m = Math.floor(total % 3600 / 60), s = total % 60;
  return [d && d+'d',h && h+'h',m && m+'m',s+'s'].filter(Boolean).join(' ');
}
function cover(groups, cfg = appearance.read()) {
  const name = safe(settings.botName || 'RAM-MD');
  const owner = safe(settings.botOwner || 'SANJOY MAHATO');
  const count = groups.reduce((total, g) => total + g.commands.length, 0);
  const prefix = cfg.style === 'minimal' ?
    ['🤖 *' + name + '*', 'Mode: ' + mode(), 'Commands: ' + count, ''] :
    cfg.style === 'classic' ?
    ['╭━━━〔 ⚡ *RAM-MD* 〕━━━╮','┃ 🤖 ' + name,'┃ 👑 ' + owner,'┃ 🔐 ' + mode(),
     '┃ 📚 ' + count + ' listed commands', '┃ ⏱️ ' + uptime(), '╰━━━━━━━━━━━━━━━━╯',''] :
    ['╔═══『 ⚡ *RAM-MD PREMIUM* 』═══╗','║ 🤖 ' + name,
      '║ 👑 ' + owner,'║ 🔐 ' + mode(),
      '║ 🧩 ' + count + ' listed commands','║ ⏱️ ' + uptime(),
      '╚════════════════════╝',''];
  prefix.push('*📂 COMMAND CATEGORIES*');
  groups.forEach((g,i) => prefix.push((i+1)+'. '+g.icon+' *'+g.label+'*  ('+g.commands.length+')'));
  prefix.push('', '➤ *.menu 1* — open a category',
    '➤ *.menu download* — downloads',
    '➤ *.menu search <name>* — find command',
    '➤ *.menu all* — full command list');
  if (cfg.footer) prefix.push('',safe(cfg.footer,80));
  return prefix.join('\n');
}
function categoryText(group, cfg = appearance.read()) {
  const title = cfg.style === 'minimal' ? group.label : '╭━━〔 '+group.icon+' *'+group.label+'* 〕━━╮';
  const lines = [title,''];
  for (const command of group.commands) lines.push('▫️ '+command);
  lines.push('', '↩️ *.menu*  •  📚 *.menu all*');
  if (cfg.footer) lines.push(safe(cfg.footer,80));
  return lines.join('\n');
}
function findCategory(groups, query) {
  if (/^\d+$/.test(query)) return groups[Number(query)-1];
  const key = ALIASES[query] || query;
  return groups.find(g => g.key === key);
}
function paginate(groups, cfg, max = 2700) {
  const parts = [];
  let current = '';
  for (const group of groups) {
    const block = categoryText(group,cfg);
    if (current && current.length + block.length + 2 > max) {
      parts.push(current.trim());
      current = '';
    }
    if (block.length > max) {
      // A single category is always below 2700 with the bounded catalog above.
      for (const line of block.split('\n')) {
        if (current && current.length + line.length + 1 > max) {
          parts.push(current.trim()); current = '';
        }
        current += (current?'\n':'') + line;
      }
    } else current += (current?'\n\n':'') + block;
  }
  if (current) parts.push(current.trim());
  return parts;
}
function search(groups, needle) {
  const query = needle.toLowerCase().trim();
  if (!query || query.length > 50) return [];
  return groups.flatMap(g => g.commands.filter(c => c.toLowerCase().includes(query))
    .map(command => ({ command, category: g.label }))).slice(0,40);
}

async function helpCommand(sock, chatId, message, commandText = '.menu', options = {}) {
  const groups = available(options.isOwner === true || message?.key?.fromMe === true);
  const cfg = appearance.read();
  const query = String(commandText || '.menu').trim().replace(/^\.(?:menu|help|bot|list)\b\s*/i,'').toLowerCase();
  const send = text => sock.sendMessage(chatId,{text},{quoted:message});

  if (query === 'all') {
    const pages = paginate(groups,cfg);
    for (let i = 0; i < pages.length; i++) {
      await send('📚 *RAM-MD COMMAND LIST • '+(i+1)+'/'+pages.length+'*\n\n'+pages[i]);
    }
    return;
  }
  if (query.startsWith('search ')) {
    const matches = search(groups,query.slice(7));
    return send(matches.length ? '🔎 *COMMAND SEARCH*\n\n'+
      matches.map(m=>'• '+m.command+'  ('+m.category+')').join('\n') :
      '❌ No matching command. Try *.menu* or *.menu all*.');
  }
  if (query && query !== 'home') {
    const category = findCategory(groups,query);
    if (!category) return send('❌ Unknown menu category. Send *.menu* to see the numbered list.');
    return send(categoryText(category,cfg));
  }

  const text = cover(groups,cfg);
  const imageUrl = cfg.imageUrl || settings.menuImageUrl;
  if (cfg.imageEnabled && imageUrl) {
    try {
      return await sock.sendMessage(chatId, {
        image: { url: imageUrl },
        caption: text.length <= 980 ? text : '⚡ *RAM-MD PREMIUM MENU*\nSend *.menu* for all categories.'
      }, {quoted:message}).then(async () => {
        if (text.length > 980) await send(text);
      });
    } catch (error) {
      console.warn('[menu] Image unavailable, using text:', error?.message || error);
    }
  }
  return send(text);
}

module.exports = helpCommand;
module.exports.CATEGORIES = CATEGORIES;
module.exports.available = available;
module.exports.cover = cover;
module.exports.categoryText = categoryText;
module.exports.findCategory = findCategory;
module.exports.paginate = paginate;
module.exports.search = search;
