'use strict';

const settings = require('../settings');
const { isSudo } = require('./index');

// Compare complete WhatsApp identities, never arbitrary numeric substrings.
function identity(jid) {
  const match = /^([0-9]+)(?::[0-9]+)?@(s\.whatsapp\.net|lid)$/.exec(String(jid || ''));
  return match ? { number: match[1], kind: match[2] } : null;
}

async function isOwnerOrSudo(senderId, sock = null, chatId = null) {
  const sender = identity(senderId);
  const owner = String(settings.ownerNumber || '').replace(/[^0-9]/g,'');
  if (!sender || !owner) return false;

  // Direct phone-JID match is authoritative; @lid numeric values are NOT phone numbers.
  if (sender.kind === 's.whatsapp.net' && sender.number === owner) return true;

  if (sender.kind === 'lid' && sock && chatId?.endsWith('@g.us')) {
    const botLid = identity(sock.user?.lid);
    if (botLid?.kind === 'lid' && sender.number === botLid.number) return true;

    // Only the metadata record for this exact sender may establish a matching owner PN.
    try {
      const metadata = await sock.groupMetadata(chatId);
      const participant = (metadata.participants || []).find(p => {
        const id = identity(p.id);
        const lid = identity(p.lid);
        return (id?.kind === 'lid' && id.number === sender.number) ||
          (lid?.kind === 'lid' && lid.number === sender.number);
      });
      if (participant) {
        const id = identity(participant.id);
        const pn = identity(participant.phoneNumber || participant.pn);
        if ((id?.kind === 's.whatsapp.net' && id.number === owner) ||
            (pn?.kind === 's.whatsapp.net' && pn.number === owner)) return true;
      }
    } catch (error) {
      console.warn('[owner] group identity lookup unavailable:', error?.message || error);
    }
  }

  // Sudo status is based on the explicit, complete JID saved by the owner.
  try { return Boolean(await isSudo(senderId)); }
  catch (_) { return false; }
}

module.exports = isOwnerOrSudo;
module.exports.identity = identity;
