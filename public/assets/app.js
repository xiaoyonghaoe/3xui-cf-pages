(function () {
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
    ? `${data.email} · ${data.subId || ''}`
    : data.subId || '';

  document.getElementById('used-traffic').textContent = formatBytes(used);
  document.getElementById('up-down-detail').textContent = `↑ ${formatBytes(up)} / ↓ ${formatBytes(down)}`;

  if (total > 0) {
    document.getElementById('total-traffic').textContent = formatBytes(total);
    document.getElementById('remaining-traffic').textContent = `剩余 ${formatBytes(Math.max(0, total - used))}`;
    const pct = Math.min(100, (used / total) * 100);
    const fill = document.getElementById('progress-fill');
    fill.style.width = pct.toFixed(1) + '%';
    if (pct >= 90) fill.classList.add('danger');
    else if (pct >= 75) fill.classList.add('warn');
    document.getElementById('usage-percent').textContent = `${pct.toFixed(1)}%`;
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
      diffDays > 0 ? `剩余约 ${diffDays} 天` : '已到期';
  } else {
    document.getElementById('expire-date').textContent = '永久有效';
    document.getElementById('expire-countdown').textContent = '无到期限制';
  }

  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  document.getElementById('node-count').textContent = String(nodes.length);
  if (data.syncedAt) {
    const sdt = new Date(data.syncedAt);
    document.getElementById('synced-at').textContent = `同步于 ${sdt.toLocaleString('zh-CN')}`;
  }

  const rawDomain = String(data.publicDomain || window.location.origin).trim().replace(/\/+$/, '');
  const baseOrigin = /^https?:\/\//i.test(rawDomain) ? rawDomain : `https://${rawDomain}`;
  const prefix = (data.subPrefix || '').replace(/^\/+|\/+$/g, '');
  const subPath = prefix ? `/${prefix}/${data.subId}` : `/${data.subId}`;
  const subUrl = `${baseOrigin}${subPath}`;

  const urlInput = document.getElementById('sub-url-input');
  urlInput.value = subUrl;

  document.getElementById('copy-sub-btn').addEventListener('click', () => {
    copyText(subUrl, '已复制订阅链接');
  });

  const actionsEl = document.getElementById('import-actions');
  const clashUrl = `${subUrl}?format=clash`;
  const rawUrl = `${subUrl}?format=raw`;
  const titleEnc = encodeURIComponent(data.title || 'Subscription');

  const buttons = [
    { label: '导入 Clash / Mihomo', href: `clash://install-config?url=${encodeURIComponent(clashUrl)}&name=${titleEnc}` },
    { label: '导入 Shadowrocket', href: `shadowrocket://add/sub://${btoa(unescape(encodeURIComponent(rawUrl)))}?remark=${titleEnc}` },
    { label: '导入 v2rayN / Nekobox', href: `v2rayng://install-sub?url=${encodeURIComponent(rawUrl)}#${titleEnc}` },
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
      let label = `节点 #${idx + 1}`;
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
      copyBtn.addEventListener('click', () => copyText(uri, `已复制 ${label}`));
      row.appendChild(nameSpan);
      row.appendChild(copyBtn);
      nodesListEl.appendChild(row);
    });
  }
})();
