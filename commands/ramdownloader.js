'use strict';

// RAM Downloader API adapter. Existing platform-specific commands are unchanged.
const axios = require('axios');
const settings = require('../settings');

const BASE = (process.env.RAM_DOWNLOADER_API_URL || 'https://api.smp-tech.eu.cc').replace(/\/+$/, '');

function messageURL(message) {
  const text = message.message?.conversation ||
    message.message?.extendedTextMessage?.text || '';
  const matched = String(text).match(/https?:\/\/[^\s<>]+/i);
  return matched ? matched[0].replace(/[),.!?]+$/, '') : null;
}

function platformFromURL(source) {
  let parsed;
  try {
    parsed = new URL(source);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'https:') return null;
  const host = parsed.hostname.toLowerCase();
  const domain = name => host === name || host.endsWith('.' + name);
  if (domain('youtube.com') || host === 'youtu.be') return 'youtube';
  if (domain('instagram.com') || domain('instagr.am')) return 'instagram';
  if (domain('facebook.com') || domain('fb.com') || host === 'fb.watch') return 'facebook';
  if (domain('tiktok.com')) return 'tiktok';
  if (domain('twitter.com') || domain('x.com')) return 'twitter';
  if (domain('pinterest.com') || host === 'pin.it') return 'pinterest';
  if (domain('soundcloud.com')) return 'soundcloud';
  return null;
}

function bestWhatsAppVideo(response) {
  // The current API returns metadata + formats, not an MP4 file.
  // Select only combined MP4 video+audio formats; do not pass video-only streams.
  const formats = Array.isArray(response?.formats) ? response.formats : [];
  const playable = formats.filter(f =>
    f && typeof f.url === 'string' &&
    /^https:\/\//i.test(f.url) &&
    String(f.extension || '').toLowerCase() === 'mp4' &&
    f.video && f.video !== 'none' &&
    f.audio && f.audio !== 'none'
  );
  const limit = Number(process.env.RAM_DOWNLOADER_MAX_HEIGHT) || 720;
  playable.sort((a, b) => {
    const ah = Number(a.height) || 0;
    const bh = Number(b.height) || 0;
    const as = (ah > 0 && ah <= limit ? 10000 : 0) + Math.min(ah, limit);
    const bs = (bh > 0 && bh <= limit ? 10000 : 0) + Math.min(bh, limit);
    return bs - as;
  });
  return playable[0] || null;
}

function bestAudio(response) {
  const formats = Array.isArray(response?.formats) ? response.formats : [];
  const options = formats.filter(f =>
    f && typeof f.url === 'string' && /^https:\/\//i.test(f.url) &&
    ['mp3', 'm4a'].includes(String(f.extension || '').toLowerCase()) &&
    f.audio && f.audio !== 'none' && (!f.video || f.video === 'none')
  );
  options.sort((a, b) => (a.extension === 'mp3' ? -1 : 1) - (b.extension === 'mp3' ? -1 : 1));
  return options[0] || null;
}

async function ramDownloaderCommand(sock, chatId, message, mode = 'download') {
  const reply = text => sock.sendMessage(chatId, { text }, { quoted: message });

  if (mode === 'status') {
    try {
      const { data } = await axios.get(BASE + '/api/status', { timeout: 12000 });
      return reply('RAM Downloader API: ' + (data?.status === true ? 'Online ✅' : 'Unexpected response ⚠️') + '\n' + BASE);
    } catch (err) {
      console.error('[ram-downloader] health:', err.message);
      return reply('RAM Downloader API is not reachable right now.');
    }
  }

  const source = messageURL(message);
  const platform = source && platformFromURL(source);
  if (!platform) {
    return reply('Usage: .ramdl <public video URL>\nSupported: YouTube, Instagram, Facebook, TikTok, Twitter/X, Pinterest, SoundCloud.');
  }

  const apiKey = process.env.RAM_DOWNLOADER_API_KEY;
  if (!apiKey) {
    return reply('RAM Downloader API key is not configured on the bot host (RAM_DOWNLOADER_API_KEY).');
  }

  try {
    await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });
    const { data } = await axios.get(BASE + '/api/' + platform, {
      params: { url: source },
      headers: { 'x-api-key': apiKey, Accept: 'application/json' },
      timeout: 75000,
      maxRedirects: 2,
      maxContentLength: 2 * 1024 * 1024
    });

    if (data?.status !== true) {
      return reply('RAM Downloader could not extract this media. The link may be private, blocked or unavailable.');
    }

    const format = bestWhatsAppVideo(data);
    if (!format && platform === 'soundcloud') {
      const audio = bestAudio(data);
      if (audio) {
        const mp3 = audio.extension === 'mp3';
        return sock.sendMessage(chatId, {
          audio: { url: audio.url },
          mimetype: mp3 ? 'audio/mpeg' : 'audio/mp4',
          fileName: mp3 ? 'ram-audio.mp3' : 'ram-audio.m4a'
        }, { quoted: message });
      }
    }
    if (!format) {
      return reply('Metadata received for ' + platform + ', but the API returned no compatible combined MP4 (or supported SoundCloud audio). Try an existing downloader command instead.');
    }

    const title = String(data.title || 'Video').slice(0, 180);
    const caption = '*Downloaded by ' + (settings.botName || 'RAM-MD') + '*\n📝 ' + title;
    await sock.sendMessage(chatId, {
      video: { url: format.url },
      mimetype: 'video/mp4',
      caption
    }, { quoted: message });
  } catch (err) {
    // Never log the API key or a signed download URL.
    const status = err.response?.status;
    console.error('[ram-downloader]', status || err.code || err.message);
    const reason = status === 401 ? 'API key rejected (HTTP 401).' :
      status === 429 ? 'API is busy or rate-limited (HTTP 429).' :
      status === 502 ? 'Media extraction failed (HTTP 502).' :
      status ? 'HTTP ' + status + '.' :
      'Could not retrieve or send media. The source may require cookies or media headers.';
    return reply('❌ RAM Downloader: ' + reason);
  }
}

module.exports = ramDownloaderCommand;
