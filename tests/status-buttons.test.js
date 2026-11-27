'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { sendStatusButtons, extractStatusButtonCommand, IDS } = require('../lib/statusButtons');

test('legacy ON/OFF buttons carry actual Auto Status commands',async()=>{
  const messages=[];
  const sock={sendMessage:async (jid,body)=>{messages.push({jid,body})}};
  assert.equal(await sendStatusButtons(sock,'test@s.whatsapp.net',{key:{id:'a'}}),'legacy');
  assert.equal(messages.length,1);
  assert.deepEqual(messages[0].body.buttons.map(b=>b.buttonId),[
    '.autostatus on','.autostatus off','.autostatus react on'
  ]);
  assert.match(messages[0].body.text,/\.autostatus react off/);
});

test('fallback still works when interactive buttons are unsupported',async()=>{
  const messages=[];
  const sock={sendMessage:async (_jid,body)=>{
    messages.push(body);
    if(body.buttons)throw new Error('legacy disabled');
  }};
  assert.equal(await sendStatusButtons(sock,'test@s.whatsapp.net',{key:{id:'a'}}),'text');
  assert.equal(messages.length,2);
  assert.match(messages[1].text,/\.autostatus on/);
  assert.match(messages[1].text,/\.autostatus off/);
});

test('extract native and legacy button IDs but reject arbitrary commands',()=>{
  assert.equal(extractStatusButtonCommand({
    message:{buttonsResponseMessage:{selectedButtonId:IDS.on}}
  }),IDS.on);
  assert.equal(extractStatusButtonCommand({
    message:{templateButtonReplyMessage:{selectedId:IDS.off}}
  }),IDS.off);
  assert.equal(extractStatusButtonCommand({
    message:{viewOnceMessage:{message:{
      interactiveResponseMessage:{nativeFlowResponseMessage:{
        paramsJson:JSON.stringify({id:IDS.reactOn})
      }}
    }}}
  }),IDS.reactOn);
  assert.equal(extractStatusButtonCommand({
    message:{interactiveResponseMessage:{nativeFlowResponseMessage:{
      paramsJson:JSON.stringify({id:'.update'})
    }}}
  }),'');
  assert.equal(extractStatusButtonCommand({
    message:{interactiveResponseMessage:{nativeFlowResponseMessage:{
      paramsJson:'{broken'
    }}}
  }),'');
});

test('settings and main handler have button integration and owner protections',()=>{
  const root=path.join(__dirname,'..');
  const settings=fs.readFileSync(path.join(root,'commands/settings.js'),'utf8');
  const status=fs.readFileSync(path.join(root,'commands/autostatus.js'),'utf8');
  const main=fs.readFileSync(path.join(root,'main.js'),'utf8');
  assert.match(settings,/sendStatusButtons\(sock, chatId, message/);
  assert.match(status,/sendStatusButtons\(sock, chatId, msg/);
  assert.match(main,/extractStatusButtonCommand\(message\)/);
  assert.match(main,/'.autostatus'/);
  assert.match(main,/if \(isOwnerCommand\)/);
});
