import { renderSubHtml } from './_lib/html.js';
import { loadExtRouting, mergeClashRouting, mergeXrayRouting } from './_lib/routing.js';

const SUB_ID_RE = /^[A-Za-z0-9_-]{4,128}$/;
const RULESET_NAME_RE = /^[A-Za-z0-9._-]{1,128}$/;
const CLASH_UA_RE = /(clash|mihomo|stash|sing-box|flclash|verge|nyanpasu)/i;
const JSON_UA_RE = /(xray|v2ray-json)/i;

function normalizePrefix(raw) {
  return String(raw || '').replace(/^\/+|\/+$/g, '');
}

function base64Utf8(text) {
  const bytes = new TextEncoder().encode(String(text || ''));
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

export function buildUserinfoHeader(record) {
  const up = Math.max(0, Number(record.up) || 0);
  const down = Math.max(0, Number(record.down) || 0);
  const total = Math.max(0, Number(record.total) || 0);
  const expiryMs = Number(record.expiryTime) || 0;
  let value = `upload=${up}; download=${down}; total=${total}`;
  if (expiryMs > 0) {
    value += `; expire=${Math.floor(expiryMs / 1000)}`;
  }
  return value;
}

export function detectFormat({ explicitFormat, subPathFormat, userAgent, accept }) {
  const candidate = (subPathFormat || explicitFormat || '').toLowerCase().trim();
  if (candidate === 'clash' || candidate === 'yaml') return 'clash';
  if (candidate === 'json' || candidate === 'xray') return 'json';
  if (candidate === 'raw' || candidate === 'base64' || candidate === 'v2ray') return 'raw';
  if (candidate === 'html') return 'html';

  const ua = userAgent || '';
  if (CLASH_UA_RE.test(ua)) return 'clash';
  if (JSON_UA_RE.test(ua)) return 'json';
  if ((accept || '').toLowerCase().includes('text/html')) return 'html';
  return 'raw';
}

function notFoundResponse() {
  return new Response('Not Found', {
    status: 404,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function parseRoute(pathname, configuredPrefix) {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  if (cleanPath === '/') {
    return { kind: 'root' };
  }

  const segments = cleanPath.slice(1).split('/').filter(Boolean);

  if (segments[0] === 'rules' && segments.length === 2 && RULESET_NAME_RE.test(segments[1])) {
    return { kind: 'ruleset', name: segments[1] };
  }

  const prefix = normalizePrefix(configuredPrefix);
  let rest = segments;
  if (prefix) {
    const prefixSegs = prefix.split('/').filter(Boolean);
    if (segments.length <= prefixSegs.length) {
      return { kind: 'unknown' };
    }
    for (let i = 0; i < prefixSegs.length; i++) {
      if (segments[i] !== prefixSegs[i]) {
        return { kind: 'unknown' };
      }
    }
    rest = segments.slice(prefixSegs.length);
  }

  if (rest.length === 1 && SUB_ID_RE.test(rest[0])) {
    return { kind: 'sub', subId: rest[0], pathFormat: '' };
  }
  if (rest.length === 2 && SUB_ID_RE.test(rest[0]) && ['raw', 'clash', 'json', 'html'].includes(rest[1].toLowerCase())) {
    return { kind: 'sub', subId: rest[0], pathFormat: rest[1].toLowerCase() };
  }
  return { kind: 'unknown' };
}

function applyCommonSubHeaders(headers, record, env) {
  headers.set('Subscription-Userinfo', buildUserinfoHeader(record));
  const title = record.title || record.email || record.subId || 'Subscription';
  headers.set('Profile-Title', `base64:${base64Utf8(title)}`);
  const interval = String(env.PROFILE_UPDATE_INTERVAL || record.updateInterval || '12').trim();
  if (interval) {
    headers.set('Profile-Update-Interval', interval);
  }
  headers.set('Cache-Control', 'no-store');
  headers.set('Vary', 'User-Agent, Accept');
  headers.set('X-Content-Type-Options', 'nosniff');
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405, headers: { 'Cache-Control': 'no-store' } });
  }

  const url = new URL(request.url);
  const route = parseRoute(url.pathname, env.SUB_PREFIX);

  if (route.kind === 'root' || route.kind === 'unknown') {
    return notFoundResponse();
  }

  if (!env.SUB_KV) {
    return new Response('SUB_KV binding is missing', { status: 500, headers: { 'Cache-Control': 'no-store' } });
  }

  if (route.kind === 'ruleset') {
    const content = await env.SUB_KV.get(`routing:ruleset:${route.name}`);
    if (content === null) {
      return notFoundResponse();
    }
    const contentType = route.name.endsWith('.json')
      ? 'application/json; charset=utf-8'
      : 'text/plain; charset=utf-8';
    return new Response(request.method === 'HEAD' ? null : content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  }

  const record = await env.SUB_KV.get(`sub:${route.subId}`, 'json');
  if (!record || typeof record !== 'object') {
    return notFoundResponse();
  }

  const format = detectFormat({
    explicitFormat: url.searchParams.get('format'),
    subPathFormat: route.pathFormat,
    userAgent: request.headers.get('User-Agent') || '',
    accept: request.headers.get('Accept') || '',
  });

  if (format === 'html') {
    const html = renderSubHtml({
      subId: route.subId,
      email: record.email || '',
      title: record.title || record.email || 'Subscription',
      up: Number(record.up) || 0,
      down: Number(record.down) || 0,
      total: Number(record.total) || 0,
      expiryTime: Number(record.expiryTime) || 0,
      enable: record.enable !== false,
      nodes: Array.isArray(record.nodes) ? record.nodes : [],
      syncedAt: record.syncedAt || '',
      publicDomain: env.PUBLIC_DOMAIN || record.publicDomain || url.origin,
      subPrefix: env.SUB_PREFIX || record.subPrefix || '',
    });
    return new Response(request.method === 'HEAD' ? null : html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  if (record.enable === false) {
    return new Response('Subscription disabled', {
      status: 403,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    });
  }

  const extRoutingEnabled = String(env.ENABLE_EXT_ROUTING ?? 'true').toLowerCase() !== 'false';
  const headers = new Headers();
  applyCommonSubHeaders(headers, record, env);

  if (format === 'clash') {
    let body = record.clash || '';
    if (!body) {
      return notFoundResponse();
    }
    if (extRoutingEnabled) {
      const extClash = await loadExtRouting(env.SUB_KV, 'clash');
      if (extClash) {
        body = mergeClashRouting(body, extClash);
      }
    }
    headers.set('Content-Type', 'text/yaml; charset=utf-8');
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
  }

  if (format === 'json') {
    let body = record.json || '';
    if (!body) {
      return notFoundResponse();
    }
    if (extRoutingEnabled) {
      const extXray = await loadExtRouting(env.SUB_KV, 'xray');
      if (extXray) {
        body = mergeXrayRouting(body, extXray);
      }
    }
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(request.method === 'HEAD' ? null : body, { status: 200, headers });
  }

  const rawBody = record.raw || '';
  if (!rawBody) {
    return notFoundResponse();
  }
  headers.set('Content-Type', 'text/plain; charset=utf-8');
  return new Response(request.method === 'HEAD' ? null : rawBody, { status: 200, headers });
}
