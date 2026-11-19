import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/[[path]].js';

function createMockKV(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    async get(key, type) {
      if (!store.has(key)) return null;
      const val = store.get(key);
      if (type === 'json') {
        return typeof val === 'string' ? JSON.parse(val) : val;
      }
      return typeof val === 'string' ? val : JSON.stringify(val);
    },
  };
}

const sampleRecord = {
  subId: 'abc12345xyz',
  email: 'alice',
  title: 'Alice Plan',
  up: 1024,
  down: 2048,
  total: 107374182400,
  expiryTime: 1893456000000,
  enable: true,
  nodes: ['vless://uuid@1.2.3.4:443#Node-A'],
  raw: 'dmxlc3M6Ly91dWlkQDEuMi4zLjQ6NDQzI05vZGUtQQ==',
  clash: [
    'proxies:',
    '  - name: Node-A',
    'rules:',
    '  - GEOIP,CN,DIRECT',
    '  - MATCH,PROXY',
  ].join('\n'),
  json: JSON.stringify({
    routing: {
      rules: [{ type: 'field', ip: ['geoip:cn'], outboundTag: 'direct' }],
    },
    outbounds: [{ tag: 'proxy', protocol: 'vless' }],
  }),
  syncedAt: '2026-11-19T08:00:00Z',
};

test('root and unknown subId return 404', async () => {
  const kv = createMockKV({ 'sub:abc12345xyz': sampleRecord });

  const rootRes = await onRequest({
    request: new Request('https://sub.example.com/'),
    env: { SUB_KV: kv },
  });
  assert.equal(rootRes.status, 404);

  const missRes = await onRequest({
    request: new Request('https://sub.example.com/nonexistent123'),
    env: { SUB_KV: kv },
  });
  assert.equal(missRes.status, 404);
});

test('browser request renders HTML with publicDomain and traffic info', async () => {
  const kv = createMockKV({ 'sub:abc12345xyz': sampleRecord });
  const res = await onRequest({
    request: new Request('https://pages-internal.example/abc12345xyz', {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    }),
    env: { SUB_KV: kv, PUBLIC_DOMAIN: 'https://cf.example.com', SUB_PREFIX: '' },
  });
  assert.equal(res.status, 200);
  assert.match(res.headers.get('Content-Type'), /text\/html/);
  const body = await res.text();
  assert.match(body, /https:\/\/cf\.example\.com/);
  assert.match(body, /Alice Plan/);
  assert.match(body, /abc12345xyz/);
  assert.match(body, /<style>/);
  assert.match(body, /formatBytes/);
  assert.doesNotMatch(body, /\/assets\/style\.css/);
  assert.doesNotMatch(body, /\/assets\/app\.js/);
});

test('v2rayN UA returns base64 raw payload and Subscription-Userinfo header', async () => {
  const kv = createMockKV({ 'sub:abc12345xyz': sampleRecord });
  const res = await onRequest({
    request: new Request('https://cf.example.com/abc12345xyz', {
      headers: { 'User-Agent': 'v2rayN/6.60' },
    }),
    env: { SUB_KV: kv },
  });
  assert.equal(res.status, 200);
  assert.equal(
    res.headers.get('Subscription-Userinfo'),
    'upload=1024; download=2048; total=107374182400; expire=1893456000',
  );
  assert.ok(res.headers.get('Profile-Title')?.startsWith('base64:'));
  assert.equal(await res.text(), sampleRecord.raw);
});

test('Clash UA merges routing:clash rules before MATCH', async () => {
  const kv = createMockKV({
    'sub:abc12345xyz': sampleRecord,
    'routing:clash': {
      prepend_rules: ['DOMAIN-SUFFIX,openai.com,PROXY'],
      append_rules: ['DOMAIN-SUFFIX,corp.local,DIRECT'],
      rule_providers: {
        custom_cn: { type: 'http', behavior: 'domain', url: 'https://cf.example.com/rules/cn.yaml' },
      },
    },
  });
  const res = await onRequest({
    request: new Request('https://cf.example.com/abc12345xyz', {
      headers: { 'User-Agent': 'Clash-Verge/2.0' },
    }),
    env: { SUB_KV: kv, ENABLE_EXT_ROUTING: 'true' },
  });
  assert.equal(res.status, 200);
  const yaml = await res.text();
  assert.match(yaml, /rule-providers:/);
  assert.match(yaml, /custom_cn:/);
  const openAiIdx = yaml.indexOf('DOMAIN-SUFFIX,openai.com,PROXY');
  const geoIdx = yaml.indexOf('GEOIP,CN,DIRECT');
  const corpIdx = yaml.indexOf('DOMAIN-SUFFIX,corp.local,DIRECT');
  const matchIdx = yaml.indexOf('MATCH,PROXY');
  assert.ok(openAiIdx >= 0 && openAiIdx < geoIdx);
  assert.ok(geoIdx < corpIdx && corpIdx < matchIdx);
});

test('Xray JSON merges routing:xray and SUB_PREFIX works', async () => {
  const kv = createMockKV({
    'sub:abc12345xyz': sampleRecord,
    'routing:xray': {
      prepend_rules: [{ type: 'field', domain: ['geosite:openai'], outboundTag: 'proxy' }],
      outbounds_append: [{ tag: 'direct', protocol: 'freedom' }],
    },
    'routing:ruleset:cn.yaml': 'payload:\n  - DOMAIN-SUFFIX,cn\n',
  });

  const jsonRes = await onRequest({
    request: new Request('https://cf.example.com/s/abc12345xyz?format=json'),
    env: { SUB_KV: kv, SUB_PREFIX: '/s/' },
  });
  assert.equal(jsonRes.status, 200);
  const parsed = JSON.parse(await jsonRes.text());
  assert.equal(parsed.routing.rules[0].domain[0], 'geosite:openai');
  assert.equal(parsed.outbounds.length, 2);

  const ruleRes = await onRequest({
    request: new Request('https://cf.example.com/rules/cn.yaml'),
    env: { SUB_KV: kv },
  });
  assert.equal(ruleRes.status, 200);
  assert.match(await ruleRes.text(), /DOMAIN-SUFFIX,cn/);
});

test('disabled user returns 403 for clients', async () => {
  const kv = createMockKV({
    'sub:abc12345xyz': { ...sampleRecord, enable: false },
  });
  const res = await onRequest({
    request: new Request('https://cf.example.com/abc12345xyz', {
      headers: { 'User-Agent': 'Shadowrocket/2.2' },
    }),
    env: { SUB_KV: kv },
  });
  assert.equal(res.status, 403);
});
