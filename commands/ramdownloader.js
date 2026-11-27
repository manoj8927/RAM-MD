'use strict';
const axios = require('axios');
const settings = require('../settings');

const BASE = (process.env.RAM_DOWNLOADER_API_URL || 'https://api.smp-tech.eu.cc').replace(/\/$/, '');
const TIMEOUT = 30000;
function urlFromMessage(message) {
  const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
  return (text.match(/https?:\/\/[^\s<>]+/i) || [])[0]?.replace(/[),.!?]+$/, '') || '';
}
function mediaFromResponse(body) {
  const root = body?.result || body?.data || body;
  const candidates = [root?.downloadUrl, root?.download, root?.url, root?.video, root?.audio, root?.media?.video_hd, root?.media?.video_sd, root?.media?.url];
  const item = candidates.find(x => typeof x === 'string' && /^https?:\/\//i.test(x));
  if (item) return { url: item, title: root?.title || body?.title || 'RAM Downloader', type: root?.type || root?.mimetype || '' };
  if (Array.isArray(root?.formats)) {
    const format = root.formats.find(x => /^https?:\/\//i.test(x?.url || ''));
    if (format) return { url: format.url, title: root?.title || 'RAM Downloader', type: format?.mimeType || '' };
  }
  return null;
}
async function ramDownloaderCommand(sock, chatId, message, mode = 'download') {
  const reply = text => sock.sendMessage(chatId, { text }, { quoted: message });
  try {
    if (mode === 'status') {
      const { data } = await axios.get(BASE + '/api/status', { timeout: 10000 });
      return reply('RAM Downloader API: ' + (data?.status === true ? 'Online' : 'Response received') + '\n' + BASE);
    }
    const source = urlFromMessage(message);
    if (!source) return reply('Usage: .ramdl https://example.com/video\nSet RAM_DOWNLOADER_API_PATH to the verified API download route.');
    const path = process.env.RAM_DOWNLOADER_API_PATH;
    if (!path || !/^\/[\w/.-]+$/.test(path)) return reply('RAM Downloader API download route is not configured. Set RAM_DOWNLOADER_API_PATH to the verified path first.');
    const { data } = await axios.get(BASE + path, {
      params: { url: source }, timeout: TIMEOUT, maxRedirects: 3,
      headers: { Accept: 'application/json' }
    });
    const media = mediaFromResponse(data);
    if (!media) return reply('API responded but did not return a recognized media URL. Check the download endpoint response format.');
    const isAudio = /audio|mp3|m4a/i.test(media.type) || /\.(mp3|m4a)(\?|$)/i.test(media.url);
    const caption = '*Downloaded by ' + (settings.botName || 'RAM-MD') + '*\n' + media.title;
    if (isAudio) {
      return sock.sendMessage(chatId, { audio: { url: media.url }, mimetype: 'audio/mpeg', fileName: 'ram-download.mp3' }, { quoted: message });
    }
    return sock.sendMessage(chatId, { video: { url: media.url }, mimetype: 'video/mp4', caption }, { quoted: message });
  } catch (error) {
    console.error('[ram-downloader]', error.message);
    return reply('RAM Downloader request failed: ' + (error.response?.status ? 'HTTP ' + error.response.status : 'Network or media error'));
  }
}
module.exports = ramDownloaderCommand;
