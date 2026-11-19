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
  <link rel="stylesheet" href="/assets/style.css" />
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
  <script src="/assets/app.js"></script>
</body>
</html>`;
}
