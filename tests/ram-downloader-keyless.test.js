'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'commands', 'ramdownloader.js'), 'utf8');

function load(get, env = {}) {
  const module = { exports: {} };
  const consoleStub = { error: () => {} };
  new Function('require', 'module', 'process', 'URL', 'console', source)(
    name => {
      if (name === 'axios') return {get};
      if (name === '../settings') return {botName:'RAM-MD'};
      throw new Error('Unexpected module: ' + name);
    },
    module,
    { env },
    URL,
    consoleStub
  );
  return module.exports;
}

function fixture(url = 'https://youtube.com/shorts/test123') {
  const sent = [];
  const sock = {sendMessage: async (_jid, body) => {
    sent.push(body);
    return {key: {id: 'test-reply'}};
  }};
  const msg = {
    key: {id:'inbound'},
    message: {conversation: '.ramdl ' + url}
  };
  return {sock,msg,sent};
}

function success() {
  return { data: {
    status:true,
    title:'Unit test video',
    formats:[{
      url:'https://cdn.example.com/test.mp4',
      extension:'mp4',
      video:'h264',
      audio:'aac',
      height:720
    }]
  }};
}

test('public API sends no x-api-key and still downloads a video', async () => {
  let request;
  const get = async (url, options) => {
    request = {url, options};
    return success();
  };
  const run = load(get);
  const ctx = fixture();
  await run(ctx.sock, 'chat@s.whatsapp.net', ctx.msg);
  assert.equal(request.url, 'https://api.smp-tech.eu.cc/api/youtube');
  assert.equal(request.options.params.url, 'https://youtube.com/shorts/test123');
  assert.deepEqual(request.options.headers,{Accept:'application/json'});
  assert.equal(ctx.sent.length,2);
  assert.equal(ctx.sent[1].video.url,'https://cdn.example.com/test.mp4');
});

test('private API sends configured key as header without exposing it to chat', async () => {
  let headers;
  const get = async (_url, opts) => { headers = opts.headers; return success(); };
  const run = load(get,{RAM_DOWNLOADER_API_KEY:'test-private-secret'});
  const ctx = fixture();
  await run(ctx.sock, 'chat@s.whatsapp.net', ctx.msg);
  assert.equal(headers['x-api-key'],'test-private-secret');
  assert.ok(!JSON.stringify(ctx.sent).includes('test-private-secret'));
});

test('API 401 without a key explains server must enable public access', async () => {
  const get = async () => { const error = new Error('Unauthorized');error.response={status:401};throw error;};
  const run = load(get);
  const ctx = fixture();
  await run(ctx.sock, 'chat@s.whatsapp.net', ctx.msg);
  assert.match(ctx.sent.at(-1).text,/requires authentication/);
  assert.match(ctx.sent.at(-1).text,/enable public access/);
});

test('API 403 with an incorrect key explains private authentication', async () => {
  const get = async () => { const error = new Error('Forbidden');error.response={status:403};throw error;};
  const run = load(get,{RAM_DOWNLOADER_API_KEY:'incorrect-key'});
  const ctx = fixture();
  await run(ctx.sock,'chat@s.whatsapp.net',ctx.msg);
  assert.match(ctx.sent.at(-1).text,/rejected the configured key/);
  assert.ok(!ctx.sent.at(-1).text.includes('incorrect-key'));
});

test('unsupported URL gets usage instead of calling API', async () => {
  const get = async () => {throw new Error('Should not call API');};
  const run = load(get);
  const ctx = fixture('http://127.0.0.1/test');
  await run(ctx.sock, 'chat@s.whatsapp.net', ctx.msg);
  assert.match(ctx.sent.at(-1).text,/Usage/);
});
