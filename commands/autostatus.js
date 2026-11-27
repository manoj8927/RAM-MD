'use strict';

const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const { sendStatusButtons } = require('../lib/statusButtons');

const configPath = path.join(__dirname, '..', 'data', 'autoStatus.json');
const DEFAULTS = Object.freeze({enabled: false, reactOn: false, emojis: ['💚']});
const SEEN_TTL = 30 * 60 * 1000;
const MAX_SEEN = 500;
const completed = new Map();
const inFlight = new Map();

function readConfig() {
    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {...DEFAULTS};
        const emojis = Array.isArray(parsed.emojis) && parsed.emojis.length <= 8 &&
            parsed.emojis.length > 0 && parsed.emojis.every(isEmoji)
            ? parsed.emojis : [...DEFAULTS.emojis];
        return {enabled: parsed.enabled === true, reactOn: parsed.reactOn === true, emojis};
    } catch (_) {
        return {...DEFAULTS, emojis: [...DEFAULTS.emojis]};
    }
}

function saveConfig(config) {
    fs.mkdirSync(path.dirname(configPath), {recursive:true});
    const temporary = configPath + '.' + process.pid + '.tmp';
    try {
        fs.writeFileSync(temporary, JSON.stringify(config, null, 2) + '\n', {mode:0o600});
        fs.renameSync(temporary, configPath);
    } catch (e) {
        try {fs.rmSync(temporary, {force:true});} catch (_) {}
        throw e;
    }
}

function isEmoji(value) {
    if (typeof value !== 'string' || !value || value.length > 20 ||
        !/\p{Extended_Pictographic}/u.test(value)) return false;
    const split = new Intl.Segmenter('en',{granularity:'grapheme'});
    return [...split.segment(value)].length === 1;
}

function pickEmoji(config, id) {
    const list = config.emojis || ['💚'];
    let hash = 0;
    for (const char of String(id)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return list[hash % list.length];
}

function normalizeJid(value) {
    const match = /^([0-9]+)(?::[0-9]+)?@(s\.whatsapp\.net|lid)$/.exec(String(value || ''));
    return match ? match[1] + '@' + match[2] : '';
}

function isOwnStatus(sock, key) {
    if (key.fromMe === true) return true;
    const participant = normalizeJid(key.participant);
    if (!participant) return true; // no safe reaction recipient
    return [sock.user?.id, sock.user?.lid, sock.user?.jid]
        .some(jid => normalizeJid(jid) === participant);
}

function prune(now) {
    for (const [id, value] of completed) {
        if (now - value.time > SEEN_TTL) completed.delete(id);
    }
    while (completed.size > MAX_SEEN) completed.delete(completed.keys().next().value);
}

// Use the original status message key, and address its author's JID.
// A status reaction is not a new broadcast status and must not reuse the source ID.
async function reactToStatus(sock, key, emoji) {
    const author = normalizeJid(key.participant);
    if (!author || !key.id) throw new Error('Status author or message ID is missing');
    return sock.sendMessage('status@broadcast', {
        react: {
            text: emoji,
            key: {
                remoteJid: 'status@broadcast',
                id: key.id,
                participant: key.participant,
                fromMe: false
            }
        }
    }, {statusJidList:[author]});
}

async function processStatus(sock, msg) {
    const key = msg?.key;
    if (!key || key.remoteJid !== 'status@broadcast' || !key.id ||
        !msg?.message || msg.message.reactionMessage || isOwnStatus(sock,key)) return;

    const config = readConfig();
    if (!config.enabled && !config.reactOn) return;

    const author = normalizeJid(key.participant);
    const lookup = author + ':' + key.id;
    if (inFlight.has(lookup)) return inFlight.get(lookup);
    const task = (async () => {
        const now = Date.now();
        prune(now);
        const entry = completed.get(lookup) || {viewed:false,reacted:false,time:now};
        if (config.enabled && !entry.viewed) {
            try {
                await sock.readMessages([key]);
                entry.viewed = true;
            } catch (error) {
                console.warn('[autostatus] Status view failed:', error?.message || error);
            }
        }
        if (config.reactOn && !entry.reacted) {
            try {
                const emoji = pickEmoji(config,key.id);
                await reactToStatus(sock,key,emoji);
                entry.reacted = true;
            } catch (error) {
                console.warn('[autostatus] Status emoji reaction failed:',error?.message || error);
            }
        }
        entry.time = now;
        completed.delete(lookup);
        completed.set(lookup,entry);
        prune(now);
    })();
    inFlight.set(lookup,task);
    try {await task;} finally {inFlight.delete(lookup);}
}

async function handleStatusUpdate(sock,status) {
    // Never react to a reaction event, otherwise it can create loops.
    if (!status || status.reaction || status.reactions) return;
    const msgs = Array.isArray(status.messages)
        ? status.messages : (status.key && status.message ? [status] : []);
    for (const msg of msgs) await processStatus(sock,msg);
}

async function autoStatusCommand(sock,chatId,msg,args = []) {
    const reply = text => sock.sendMessage(chatId,{text},{quoted:msg});
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        if (!msg.key.fromMe && !await isOwnerOrSudo(senderId,sock,chatId))
            return reply('❌ Only the bot owner or sudo can control Auto Status.');

        const config = readConfig();
        const [command,first,...extra] = Array.isArray(args) ? args.map(v=>String(v).trim()) : [];
        if (!command || command === 'show' || command === 'status') {
            const result = [
                '╭━━〔 💚 *RAM-MD STATUS REACT* 〕━━╮',
                '┃ 👁️ Auto View: *' + (config.enabled?'ON':'OFF') + '*',
                '┃ 💚 Auto React: *' + (config.reactOn?'ON':'OFF') + '*',
                '┃ 🎨 Emojis: ' + config.emojis.join(' '),
                '╰━━━━━━━━━━━━━━━━━━╯',
                '',
                '⚙️ .autostatus on / off',
                '💚 .autostatus react on / off',
                '🎨 .autostatus emoji ❤️',
                '✨ .autostatus emojis 💚 ❤️ 🔥 ♻️',
                '💬 .settings'
            ].join('\n');
            await reply(result);
            try { await sendStatusButtons(sock,chatId,msg,'💚 *Auto Status Controls*',{reactOn:config.reactOn}); }
            catch (error) { console.warn('[autostatus] quick controls unavailable:',error?.message); }
            return;
        }

        if (command === 'on' || command === 'off') {
            if (first || extra.length) return reply('Usage: .autostatus on/off');
            config.enabled = command === 'on';
            saveConfig(config);
            return reply('✅ Auto Status *VIEW ' + (config.enabled?'ON':'OFF') + '*.\n💚 Auto React: '+
                (config.reactOn?'ON':'OFF')+' (independent setting).');
        }
        if (command === 'react') {
            if ((first !== 'on' && first !== 'off') || extra.length)
                return reply('Usage: .autostatus react on/off');
            config.reactOn = first === 'on';
            saveConfig(config);
            return reply('✅ Auto Status *REACTION ' + (config.reactOn?'ON':'OFF') +
                '*.\nEmoji: '+config.emojis.join(' '));
        }
        if (command === 'emoji' || command === 'emojis') {
            const values = [first,...extra].filter(Boolean);
            if (!values.length || values.length > 8 || (command === 'emoji' && values.length !== 1) ||
                values.some(v=>!isEmoji(v)))
                return reply('❌ Use 1–8 real emoji (no text).\nExamples:\n.autostatus emoji ❤️\n.autostatus emojis 💚 ❤️ 🔥 ♻️');
            config.emojis = values;
            saveConfig(config);
            return reply('✅ Status emoji updated: '+values.join(' ')+
                '\n💚 Enable with *.autostatus react on*.');
        }
        return reply('Unknown option. Send *.autostatus* for settings.');
    } catch (error) {
        console.error('[autostatus] command failed:',error?.message || error);
        return reply('❌ Unable to save Auto Status settings. Check data folder permissions.');
    }
}

module.exports = {
    autoStatusCommand, handleStatusUpdate,
    readConfig, reactToStatus, processStatus, isEmoji, pickEmoji, isOwnStatus
};
