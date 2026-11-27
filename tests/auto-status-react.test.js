'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    reactToStatus, processStatus, handleStatusUpdate,
    isEmoji, pickEmoji, isOwnStatus
} = require('../commands/autostatus');
const {extractStatusButtonCommand, IDS, sendStatusButtons} = require('../lib/statusButtons');

function incoming(id='status-test-001', participant='919900001234@s.whatsapp.net') {
    return {key:{id,remoteJid:'status@broadcast',participant,fromMe:false},
        message:{imageMessage:{caption:'test status'}}};
}
function socket() {
    const sent=[],read=[];
    return {
        user:{id:'911111111111@s.whatsapp.net',lid:'123456789@lid'},
        sent,read,
        async sendMessage(...args) {sent.push(args);return {key:{id:'new-response-id'}}},
        async readMessages(keys) {read.push(keys);}
    };
}
const cfg=(enabled,reactOn,emojis=['💚'])=>({enabled,reactOn,emojis});

test('reaction uses original status key and a fresh outgoing message',async()=>{
    const sock=socket();
    const msg=incoming('status-original-1');
    await reactToStatus(sock,msg.key,'❤️');
    assert.equal(sock.sent.length,1);
    const [jid,payload,opts]=sock.sent[0];
    assert.equal(jid,'status@broadcast');
    assert.equal(payload.react.text,'❤️');
    assert.equal(payload.react.key.id,'status-original-1');
    assert.equal(payload.react.key.participant,'919900001234@s.whatsapp.net');
    assert.equal(payload.react.key.fromMe,false);
    assert.deepEqual(opts.statusJidList,['919900001234@s.whatsapp.net']);
    assert.ok(!opts.messageId,'do not reuse source ID as outgoing reaction message ID');
});

test('view ON and react ON each run once despite duplicate events',async()=>{
    const sock=socket();
    const msg=incoming('status-duplicate-002');
    await Promise.all([
        processStatus(sock,msg,cfg(true,true,['💚'])),
        handleStatusUpdate(sock,{messages:[msg]},cfg(true,true,['💚']))
    ]);
    await processStatus(sock,msg,cfg(true,true,['💚']));
    assert.equal(sock.read.length,1);
    assert.equal(sock.sent.length,1);
    assert.equal(sock.sent[0][1].react.text,'💚');
});

test('reaction works independently when Auto View is OFF',async()=>{
    const sock=socket();
    await processStatus(sock,incoming('status-react-only-003'),cfg(false,true,['🔥']));
    assert.equal(sock.read.length,0);
    assert.equal(sock.sent.length,1);
    assert.equal(sock.sent[0][1].react.text,'🔥');
});

test('view without react only marks a status read',async()=>{
    const sock=socket();
    await processStatus(sock,incoming('status-view-only-004'),cfg(true,false));
    assert.equal(sock.read.length,1);
    assert.equal(sock.sent.length,0);
});

test('do not react to self, invalid authors or incoming reactions',async()=>{
    const sock=socket();
    const mine=incoming('status-own-005','911111111111@s.whatsapp.net');
    await processStatus(sock,mine,cfg(true,true));
    await processStatus(sock,incoming('status-lid-own-006','123456789@lid'),cfg(true,true));
    await processStatus(sock,incoming('status-no-author-007','status@broadcast'),cfg(true,true));
    await processStatus(sock,{...incoming('status-reaction-008'),message:{reactionMessage:{text:'❤️'}}},cfg(true,true));
    await handleStatusUpdate(sock,{reaction:{key:incoming('status-feedback-009').key}},cfg(true,true));
    assert.equal(sock.read.length,0);
    assert.equal(sock.sent.length,0);
    assert.equal(isOwnStatus(sock,mine.key),true);
});

test('valid emoji are single grapheme clusters and selection is stable',()=>{
    for(const emoji of ['❤️','💚','🔥','♻️','🥰','👍🏽']) assert.equal(isEmoji(emoji),true,emoji);
    for(const value of ['abc','hello 💚','❤️💚','','x'.repeat(30)]) assert.equal(isEmoji(value),false,value);
    const a=pickEmoji(cfg(false,true,['💚','❤️','🔥']), 'unique-message-1');
    assert.ok(['💚','❤️','🔥'].includes(a));
    assert.equal(pickEmoji(cfg(false,true,['💚','❤️','🔥']), 'unique-message-1'),a);
});

test('native and legacy React OFF selection is safely routed',async()=>{
    assert.equal(extractStatusButtonCommand({
        message:{interactiveResponseMessage:{nativeFlowResponseMessage:{
            paramsJson:JSON.stringify({id: IDS.reactOff})
        }}}
    }),'.autostatus react off');
    const sock=socket();
    const mode=await sendStatusButtons(sock,'test@s.whatsapp.net',{key:{id:'q'}},'Auto Status',{reactOn:true});
    assert.ok(['native','legacy'].includes(mode));
    if(mode==='legacy')assert.equal(sock.sent[0][1].buttons[2].buttonId,'.autostatus react off');
});

test('all preset exposes 162 valid unique emoji and concise summary',()=>{
    const {ALL_EMOJIS,parseEmojiSelection,isAllEmojis,describeEmojis}=require('../commands/autostatus');
    assert.equal(ALL_EMOJIS.length,162);
    assert.equal(new Set(ALL_EMOJIS).size,ALL_EMOJIS.length);
    assert.ok(ALL_EMOJIS.every(isEmoji));
    const preset=parseEmojiSelection('emojis',['all']);
    assert.deepEqual(preset,ALL_EMOJIS);
    assert.equal(isAllEmojis(preset),true);
    assert.match(describeEmojis({emojis:preset}),/ALL \(162 emojis\)/);
    assert.ok(describeEmojis({emojis:preset}).length<100);
    assert.deepEqual(parseEmojiSelection('emoji',['🥰']),['🥰']);
    assert.deepEqual(parseEmojiSelection('emojis',['💚','❤️','💚']),['💚','❤️']);
    assert.throws(()=>parseEmojiSelection('emoji',['all']),/Use 1/);
    assert.throws(()=>parseEmojiSelection('emojis',new Array(33).fill('💚')),/Use 1/);
});

test('all emoji preset reacts with only one member of the selection',async()=>{
    const {ALL_EMOJIS}=require('../commands/autostatus');
    const sock=socket();
    await processStatus(sock,incoming('status-all-emoji-preset-010'),cfg(false,true,ALL_EMOJIS));
    assert.equal(sock.sent.length,1);
    assert.equal(sock.read.length,0);
    assert.ok(ALL_EMOJIS.includes(sock.sent[0][1].react.text));
});
