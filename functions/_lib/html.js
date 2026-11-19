export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJsonForScript(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const INLINE_STYLE = `:root {
  --bg: #0f172a;
  --card: #1e293b;
  --card-border: #334155;
  --text: #f8fafc;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --accent-hover: #0ea5e9;
  --ok: #22c55e;
  --warn: #f59e0b;
  --danger: #ef4444;
  --surface: #0f172a;
}

@media (prefers-color-scheme: light) {
  :root {
    --bg: #f1f5f9;
    --card: #ffffff;
    --card-border: #e2e8f0;
    --text: #0f172a;
    --muted: #64748b;
    --accent: #0284c7;
    --accent-hover: #0369a1;
    --surface: #f8fafc;
  }
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.container {
  width: 100%;
  max-width: 720px;
}

.card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 20px;
}

h1 {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
  word-break: break-all;
}

.badge {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  background: rgba(148, 163, 184, 0.18);
  color: var(--muted);
}

.badge.ok {
  background: rgba(34, 197, 94, 0.16);
  color: var(--ok);
}

.badge.warn {
  background: rgba(245, 158, 11, 0.16);
  color: var(--warn);
}

.badge.danger {
  background: rgba(239, 68, 68, 0.16);
  color: var(--danger);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.stat-box {
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 12px 14px;
}

.stat-label {
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 6px;
}

.stat-value {
  font-size: 1.15rem;
  font-weight: 700;
}

.stat-sub {
  font-size: 0.75rem;
  color: var(--muted);
  margin-top: 4px;
}

.progress-wrap {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background: var(--surface);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid var(--card-border);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), var(--ok));
  transition: width 0.3s ease;
}

.progress-fill.warn {
  background: linear-gradient(90deg, var(--warn), #fb923c);
}

.progress-fill.danger {
  background: var(--danger);
}

.progress-meta {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--muted);
}

.sub-url-box {
  margin-bottom: 16px;
}

.sub-url-box label {
  display: block;
  font-size: 0.82rem;
  color: var(--muted);
  margin-bottom: 8px;
}

.url-row {
  display: flex;
  gap: 8px;
}

.url-row input {
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 10px 12px;
  color: var(--text);
  font-size: 0.88rem;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.btn {
  border: 1px solid var(--card-border);
  background: var(--surface);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 0.86rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.btn:hover {
  border-color: var(--accent);
}

.btn.primary {
  background: var(--accent);
  border-color: var(--accent);
  color: #ffffff;
}

.btn.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 18px;
}

.nodes-details {
  background: var(--surface);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 12px 14px;
}

.nodes-details summary {
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 600;
}

.nodes-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card);
}

.node-name {
  font-size: 0.84rem;
  word-break: break-all;
}

.card-footer {
  margin-top: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.78rem;
  color: var(--muted);
}

.toast {
  color: var(--ok);
  font-weight: 600;
}`;

const INLINE_SCRIPT = `(function () {
  const data = window.__SUB_DATA__ || {};

  function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
    return (n / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 2) + ' ' + units[i];
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    setTimeout(() => {
      if (el.textContent === msg) el.textContent = '';
    }, 2200);
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(label || '已复制到剪贴板');
    } catch {
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast(label || '已复制到剪贴板');
    }
  }

  const up = Number(data.up) || 0;
  const down = Number(data.down) || 0;
  const used = up + down;
  const total = Number(data.total) || 0;
  const expiryMs = Number(data.expiryTime) || 0;
  const nowMs = Date.now();
  const isExpired = expiryMs > 0 && expiryMs <= nowMs;
  const isTrafficOut = total > 0 && used >= total;
  const isEnabled = data.enable !== false;

  const badge = document.getElementById('status-badge');
  if (!isEnabled) {
    badge.textContent = '已禁用';
    badge.className = 'badge danger';
  } else if (isExpired) {
    badge.textContent = '已到期';
    badge.className = 'badge danger';
  } else if (isTrafficOut) {
    badge.textContent = '流量耗尽';
    badge.className = 'badge warn';
  } else {
    badge.textContent = '正常';
    badge.className = 'badge ok';
  }

  document.getElementById('sub-id-label').textContent = data.email
    ? \`\${data.email} · \${data.subId || ''}\`
    : data.subId || '';

  document.getElementById('used-traffic').textContent = formatBytes(used);
  document.getElementById('up-down-detail').textContent = \`↑ \${formatBytes(up)} / ↓ \${formatBytes(down)}\`;

  if (total > 0) {
    document.getElementById('total-traffic').textContent = formatBytes(total);
    document.getElementById('remaining-traffic').textContent = \`剩余 \${formatBytes(Math.max(0, total - used))}\`;
    const pct = Math.min(100, (used / total) * 100);
    const fill = document.getElementById('progress-fill');
    fill.style.width = pct.toFixed(1) + '%';
    if (pct >= 90) fill.classList.add('danger');
    else if (pct >= 75) fill.classList.add('warn');
    document.getElementById('usage-percent').textContent = \`\${pct.toFixed(1)}%\`;
  } else {
    document.getElementById('total-traffic').textContent = '不限流量';
    document.getElementById('remaining-traffic').textContent = '无限配额';
    document.getElementById('progress-fill').style.width = '100%';
    document.getElementById('usage-percent').textContent = '无限配额';
  }

  if (expiryMs > 0) {
    const dt = new Date(expiryMs);
    document.getElementById('expire-date').textContent = dt.toLocaleDateString('zh-CN');
    const diffDays = Math.ceil((expiryMs - nowMs) / 86400000);
    document.getElementById('expire-countdown').textContent =
      diffDays > 0 ? \`剩余约 \${diffDays} 天\` : '已到期';
  } else {
    document.getElementById('expire-date').textContent = '永久有效';
    document.getElementById('expire-countdown').textContent = '无到期限制';
  }

  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  document.getElementById('node-count').textContent = String(nodes.length);
  if (data.syncedAt) {
    const sdt = new Date(data.syncedAt);
    document.getElementById('synced-at').textContent = \`同步于 \${sdt.toLocaleString('zh-CN')}\`;
  }

  const rawDomain = String(data.publicDomain || window.location.origin).trim().replace(/\\/+$/, '');
  const baseOrigin = /^https?:\\/\\//i.test(rawDomain) ? rawDomain : \`https://\${rawDomain}\`;
  const prefix = (data.subPrefix || '').replace(/^\\/+|\\/+$/g, '');
  const subPath = prefix ? \`/\${prefix}/\${data.subId}\` : \`/\${data.subId}\`;
  const subUrl = \`\${baseOrigin}\${subPath}\`;

  const urlInput = document.getElementById('sub-url-input');
  urlInput.value = subUrl;

  document.getElementById('copy-sub-btn').addEventListener('click', () => {
    copyText(subUrl, '已复制订阅链接');
  });

  const actionsEl = document.getElementById('import-actions');
  const clashUrl = \`\${subUrl}?format=clash\`;
  const rawUrl = \`\${subUrl}?format=raw\`;
  const titleEnc = encodeURIComponent(data.title || 'Subscription');

  const buttons = [
    { label: '导入 Clash / Mihomo', href: \`clash://install-config?url=\${encodeURIComponent(clashUrl)}&name=\${titleEnc}\` },
    { label: '导入 Shadowrocket', href: \`shadowrocket://add/sub://\${btoa(unescape(encodeURIComponent(rawUrl)))}?remark=\${titleEnc}\` },
    { label: '导入 v2rayN / Nekobox', href: \`v2rayng://install-sub?url=\${encodeURIComponent(rawUrl)}#\${titleEnc}\` },
    { label: '复制 Clash 订阅', onClick: () => copyText(clashUrl, '已复制 Clash 链接') },
  ];

  buttons.forEach((item) => {
    if (item.href) {
      const a = document.createElement('a');
      a.className = 'btn';
      a.href = item.href;
      a.textContent = item.label;
      actionsEl.appendChild(a);
    } else {
      const b = document.createElement('button');
      b.className = 'btn';
      b.type = 'button';
      b.textContent = item.label;
      b.addEventListener('click', item.onClick);
      actionsEl.appendChild(b);
    }
  });

  const nodesListEl = document.getElementById('nodes-list');
  if (nodes.length === 0) {
    document.getElementById('nodes-details').style.display = 'none';
  } else {
    nodes.forEach((uri, idx) => {
      let label = \`节点 #\${idx + 1}\`;
      const hashIdx = uri.indexOf('#');
      if (hashIdx >= 0) {
        try {
          label = decodeURIComponent(uri.slice(hashIdx + 1)) || label;
        } catch {
          label = uri.slice(hashIdx + 1) || label;
        }
      }
      const row = document.createElement('div');
      row.className = 'node-item';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'node-name';
      nameSpan.textContent = label;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'btn';
      copyBtn.type = 'button';
      copyBtn.textContent = '复制';
      copyBtn.addEventListener('click', () => copyText(uri, \`已复制 \${label}\`));
      row.appendChild(nameSpan);
      row.appendChild(copyBtn);
      nodesListEl.appendChild(row);
    });
  }
})();`;

export function renderSubHtml(pageData) {
  const title = escapeHtml(pageData.title || 'Subscription Info');
  const serialized = safeJsonForScript(pageData);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${title}</title>
  <style>${INLINE_STYLE}</style>
</head>
<body>
  <main class="container">
    <section class="card">
      <header class="card-header">
        <div>
          <h1 id="sub-title">${title}</h1>
          <p class="subtitle" id="sub-id-label"></p>
        </div>
        <span class="badge" id="status-badge">加载中</span>
      </header>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">已用流量</div>
          <div class="stat-value" id="used-traffic">--</div>
          <div class="stat-sub" id="up-down-detail">↑ -- / ↓ --</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">总流量配额</div>
          <div class="stat-value" id="total-traffic">--</div>
          <div class="stat-sub" id="remaining-traffic">剩余 --</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">到期时间</div>
          <div class="stat-value" id="expire-date">--</div>
          <div class="stat-sub" id="expire-countdown">--</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">节点数量</div>
          <div class="stat-value" id="node-count">--</div>
          <div class="stat-sub" id="synced-at">同步于 --</div>
        </div>
      </div>

      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
        </div>
        <div class="progress-meta">
          <span id="usage-percent">0%</span>
        </div>
      </div>

      <div class="sub-url-box">
        <label for="sub-url-input">通用订阅地址（支持 Clash / v2rayN / Shadowrocket / sing-box 自动识别）</label>
        <div class="url-row">
          <input id="sub-url-input" type="text" readonly />
          <button class="btn primary" id="copy-sub-btn" type="button">复制订阅</button>
        </div>
      </div>

      <div class="actions-grid" id="import-actions"></div>

      <details class="nodes-details" id="nodes-details">
        <summary>查看节点列表与单独复制</summary>
        <div class="nodes-list" id="nodes-list"></div>
      </details>

      <footer class="card-footer">
        <span>Powered by Cloudflare Pages &amp; KV</span>
        <span id="toast" class="toast" aria-live="polite"></span>
      </footer>
    </section>
  </main>
  <script>window.__SUB_DATA__ = ${serialized};</script>
  <script>${INLINE_SCRIPT}</script>
</body>
</html>`;
}
