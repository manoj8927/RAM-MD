'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const menu = require('../commands/help');
const menuset = require('../commands/menuset');
const appearance = require('../lib/menuSettings');
const isOwner = require('../lib/isOwner');

function fixture(config = {style:'minimal',imageEnabled:false,imageUrl:'',footer:'RAM-MD'}) {
  const saved = appearance.read;
  const calls=[];
  appearance.read = () => config;
  const sock = {sendMessage:async (_,m)=>{calls.push(m);return {key:{id:'fake'}}}};
  return {sock,calls,restore:()=>{appearance.read=saved}};
}

test('public users cannot see owner-only menu category', async ()=>{
  const ctx=fixture();
  try {
    await menu(ctx.sock,'test@s.whatsapp.net',{key:{id:'a',fromMe:false}},'.menu',{isOwner:false});
    assert.equal(ctx.calls.length,1);
    assert.doesNotMatch(ctx.calls[0].text,/OWNER & SETTINGS/);
    assert.match(ctx.calls[0].text,/\.menu download/);
  } finally {ctx.restore();}
});

test('owners can open category by number or name',async()=>{
  const ctx=fixture();
  try {
    await menu(ctx.sock,'test@s.whatsapp.net',{key:{id:'a'}},'.menu 3',{isOwner:true});
    await menu(ctx.sock,'test@s.whatsapp.net',{key:{id:'b'}},'.menu download',{isOwner:true});
    assert.match(ctx.calls[0].text,/\.ramdl/);
    assert.match(ctx.calls[1].text,/\.ramapi/);
  } finally {ctx.restore();}
});

test('menu all uses safe message sizes and excludes owner commands for public',async()=>{
  const ctx=fixture();
  try {
    await menu(ctx.sock,'x@s.whatsapp.net',{key:{id:'c'}},'.menu all',{isOwner:false});
    assert.ok(ctx.calls.length>=2);
    for(const m of ctx.calls)assert.ok(m.text.length<3100,'message exceeded 3100 characters');
    assert.ok(!ctx.calls.some(m=>m.text.includes('.menuset')));
  } finally {ctx.restore();}
});

test('search finds known commands, not owner-only commands',async()=>{
  const ctx=fixture();
  try {
    await menu(ctx.sock,'x@s.whatsapp.net',{key:{id:'c'}},'.menu search ramdl',{isOwner:false});
    assert.match(ctx.calls[0].text,/\.ramdl/);
    await menu(ctx.sock,'x@s.whatsapp.net',{key:{id:'d'}},'.menu search menuset',{isOwner:false});
    assert.match(ctx.calls[1].text,/No matching command/);
  } finally {ctx.restore();}
});

test('short cover caption and image failure fallback',async()=>{
  const ctx=fixture({style:'neon',imageEnabled:true,imageUrl:'https://example.com/cover.jpg',footer:'RAM'});
  try {
    await menu(ctx.sock,'x@s.whatsapp.net',{key:{id:'1'}},'.menu',{isOwner:false});
    assert.ok(ctx.calls[0].image);
    assert.ok(ctx.calls[0].caption.length<1000);
    const sent=[];
    const sock={sendMessage:async (_,m)=>{
      sent.push(m);
      if(m.image)throw new Error('image not reachable');
    }};
    await menu(sock,'x@s.whatsapp.net',{key:{id:'2'}},'.menu',{isOwner:false});
    assert.ok(sent.at(-1).text.includes('GENERAL'));
  } finally {ctx.restore();}
});

test('menu settings reject private image URL and invalid theme',()=>{
  assert.equal(appearance.validate('style','neon'),'neon');
  assert.throws(()=>appearance.validate('style','rainbow'),/Style must/);
  assert.throws(()=>appearance.validate('imageUrl','http://example.com/p.jpg'),/public HTTPS/);
  assert.throws(()=>appearance.validate('imageUrl','https://127.0.0.1/test.jpg'),/public HTTPS/);
  assert.throws(()=>appearance.validate('footer','a'.repeat(100)),/1–80/);
});

test('menuset rejects nonowner before changing settings',async()=>{
  const ctx=fixture();
  try {
    await menuset(ctx.sock,'x@s.whatsapp.net',{key:{fromMe:false}},'.menuset style minimal',false);
    assert.match(ctx.calls[0].text,/Only the bot owner/);
  } finally {ctx.restore();}
});

test('owner JID normalizer does not match arbitrary phone substrings',()=>{
  assert.deepEqual(isOwner.identity('917047294917@s.whatsapp.net'),
    {number:'917047294917',kind:'s.whatsapp.net'});
  assert.equal(isOwner.identity('xxx917047294917@s.whatsapp.net'),null);
  assert.equal(isOwner.identity('917047294917@custom'),null);
});

test('command routing covers menu, configuration, and valid TicTacToe move handler',()=>{
  const main=fs.readFileSync(path.join(__dirname,'..','main.js'),'utf8');
  assert.match(main,/menusetCommand\(sock, chatId, message/);
  assert.match(main,/helpCommand\(sock, chatId, message, rawText/);
  assert.match(main,/await handleTicTacToeMove\(sock, chatId, senderId, String\(position\)\)/);
  assert.doesNotMatch(main,/(?<!handle)\btictactoeMove\(/);
  assert.match(main,/let chatId;\s*try/);
  assert.match(main,/groupAdminCommands\.some\(isExactCommand\)/);
});
