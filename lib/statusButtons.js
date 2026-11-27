'use strict';
// Best-effort WhatsApp quick replies. Typed commands always remain available.
const IDS = Object.freeze({
  on: '.autostatus on',
  off: '.autostatus off',
  reactOn: '.autostatus react on',
});
const CHOICES = [
  { id: IDS.on, label: '✅ Status ON' },
  { id: IDS.off, label: '❌ Status OFF' },
  { id: IDS.reactOn, label: '💚 React ON' },
];

function extractStatusButtonCommand(message) {
  const root = message?.message || {};
  const inner = root.viewOnceMessage?.message || root.viewOnceMessageV2?.message ||
    root.ephemeralMessage?.message || root;
  const raw = inner.buttonsResponseMessage?.selectedButtonId ||
    inner.templateButtonReplyMessage?.selectedId ||
    inner.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  if (typeof raw !== 'string' || raw.length > 400) return '';
  let selected = raw;
  if (raw.trim().startsWith('{')) {
    try {
      const decoded = JSON.parse(raw);
      selected = decoded?.id || decoded?.selectedId || '';
    } catch (_) { return ''; }
  }
  return Object.values(IDS).includes(selected) ? selected : '';
}

async function sendStatusButtons(sock, chatId, quoted, text = '📱 *Auto Status quick controls*') {
  const fallback = text + '\n\nTap a button if shown, or send:\n' +
    '.autostatus on\n.autostatus off\n.autostatus react on\n.autostatus react off';
  // Modern native-flow quick replies are preferred. WhatsApp clients can suppress them.
  if (typeof sock.relayMessage === 'function' && sock.user?.id) {
    try {
      const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
      const buttons = CHOICES.map(({id,label}) => ({
        name: 'quick_reply',
        buttonParamsJson: JSON.stringify({display_text:label,id}),
      }));
      const interactive = proto.Message.InteractiveMessage.create({
        body: proto.Message.InteractiveMessage.Body.create({text:fallback}),
        footer: proto.Message.InteractiveMessage.Footer.create({text:'RAM-MD • Owner controls'}),
        header: proto.Message.InteractiveMessage.Header.create({hasMediaAttachment:false}),
        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({buttons}),
      });
      const content = {
        viewOnceMessage: {
          message: {
            messageContextInfo: {deviceListMetadata:{},deviceListMetadataVersion:2},
            interactiveMessage:interactive
          }
        }
      };
      const generated = generateWAMessageFromContent(chatId,content,{
        userJid:sock.user.id,quoted,
      });
      await sock.relayMessage(chatId,generated.message,{messageId:generated.key.id});
      return 'native';
    } catch (e) {
      console.warn('[status buttons] Native flow unsupported:',e?.message);
    }
  }
  // Legacy buttons remain useful on some WhatsApp versions.
  try {
    await sock.sendMessage(chatId,{
      text:fallback,
      footer:'RAM-MD',
      buttons:CHOICES.map(({id,label})=>({
        buttonId:id,buttonText:{displayText:label},type:1
      })),
      headerType:1,
    },{quoted});
    return 'legacy';
  } catch(e) {
    console.warn('[status buttons] Legacy buttons unsupported:',e?.message);
  }
  await sock.sendMessage(chatId,{text:fallback},{quoted});
  return 'text';
}

module.exports = {sendStatusButtons,extractStatusButtonCommand,IDS,CHOICES};
