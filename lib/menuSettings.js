'use strict';

const fs = require('fs');
const path = require('path');
const FILE = path.join(__dirname, '..', 'data', 'menuSettings.json');
const DEFAULTS = Object.freeze({
  style: 'neon',
  imageEnabled: true,
  imageUrl: '',
  footer: '⚡ RAM-MD • SANJOY MAHATO',
});
const STYLES = Object.freeze(['neon', 'classic', 'minimal']);

function publicImageURL(value) {
  if (value === '') return true;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
    if (!host.includes('.') || host === 'localhost' ||
        host.endsWith('.local') || host.endsWith('.internal') ||
        host.endsWith('.localhost') || host.endsWith('.onion') ||
        /^[0-9.]+$/.test(host) || host.startsWith('[')) return false;
    return value.length <= 400;
  } catch (_) { return false; }
}

function validate(key, value) {
  if (key === 'style') {
    if (!STYLES.includes(value)) throw new Error('Style must be neon, classic or minimal.');
    return value;
  }
  if (key === 'imageEnabled') {
    if (typeof value !== 'boolean') throw new Error('Image must be on or off.');
    return value;
  }
  if (key === 'imageUrl') {
    if (typeof value !== 'string' || !publicImageURL(value.trim()))
      throw new Error('Use a public HTTPS image URL (or reset).');
    return value.trim();
  }
  if (key === 'footer') {
    if (typeof value !== 'string' || value.length > 80 ||
        !value.trim() || /[\r\n\x00-\x1f]/.test(value))
      throw new Error('Footer must be one line, 1–80 characters.');
    return value.trim();
  }
  throw new Error('Unknown menu setting.');
}

function read() {
  let saved = {};
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (data && typeof data === 'object' && !Array.isArray(data)) saved = data;
  } catch (_) {}
  const result = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    if (!Object.prototype.hasOwnProperty.call(saved, key)) continue;
    try { result[key] = validate(key, saved[key]); } catch (_) {}
  }
  return result;
}

function persist(next) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  const temp = FILE + '.' + process.pid + '.tmp';
  try {
    fs.writeFileSync(temp, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temp, FILE);
  } catch (err) {
    try { fs.rmSync(temp, { force: true }); } catch (_) {}
    throw new Error('Unable to save menu settings: ' + err.message);
  }
}

function update(key, value) {
  const next = { ...read(), [key]: validate(key, value) };
  persist(next);
  return next;
}

function reset() {
  const next = { ...DEFAULTS };
  persist(next);
  return next;
}

module.exports = { read, update, reset, validate, STYLES, FILE, DEFAULTS };
