/**
 * Extensible routing rule merger for Cloudflare KV-hosted rules.
 *
 * Supported KV keys in SUB_KV:
 * - routing:clash   -> JSON { prepend_rules?: string[], append_rules?: string[], override_rules?: string[], rule_providers?: Record<string, object> }
 * - routing:xray    -> JSON { prepend_rules?: object[], append_rules?: object[], override_rules?: object[], outbounds_append?: object[] }
 * - routing:ruleset:<name> -> Raw rule-provider text/yaml/json served at GET /rules/<name>
 */

function parseJsonSafe(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loadExtRouting(kv, kind) {
  if (!kv) return null;
  const raw = await kv.get(`routing:${kind}`);
  return parseJsonSafe(raw);
}

function formatRuleLines(rules, indent = '  ') {
  return rules
    .map((r) => String(r).trim())
    .filter(Boolean)
    .map((r) => (r.startsWith('- ') ? `${indent}${r}` : `${indent}- ${r}`));
}

function yamlValue(val, indentLevel = 2) {
  const pad = ' '.repeat(indentLevel);
  if (Array.isArray(val)) {
    return val.map((item) => `\n${pad}- ${JSON.stringify(item)}`).join('');
  }
  if (val && typeof val === 'object') {
    return Object.entries(val)
      .map(([k, v]) => `\n${pad}${k}: ${yamlValue(v, indentLevel + 2)}`)
      .join('');
  }
  if (typeof val === 'string') {
    return /[:#\n]/.test(val) ? JSON.stringify(val) : val;
  }
  return String(val);
}

export function mergeClashRouting(yamlText, ext) {
  if (!yamlText || !ext || typeof ext !== 'object') return yamlText;

  const prepend = Array.isArray(ext.prepend_rules) ? ext.prepend_rules : [];
  const append = Array.isArray(ext.append_rules) ? ext.append_rules : [];
  const override = Array.isArray(ext.override_rules) ? ext.override_rules : null;
  const providers = ext.rule_providers && typeof ext.rule_providers === 'object' ? ext.rule_providers : null;

  let lines = yamlText.replace(/\r\n/g, '\n').split('\n');

  if (providers && Object.keys(providers).length > 0) {
    const hasProviders = lines.some((l) => /^rule-providers\s*:/.test(l));
    const providerLines = [];
    for (const [name, cfg] of Object.entries(providers)) {
      if (!name || !cfg || typeof cfg !== 'object') continue;
      providerLines.push(`  ${name}:${yamlValue(cfg, 4)}`);
    }
    if (providerLines.length > 0) {
      if (hasProviders) {
        const idx = lines.findIndex((l) => /^rule-providers\s*:/.test(l));
        lines.splice(idx + 1, 0, ...providerLines);
      } else {
        const rulesIdx = lines.findIndex((l) => /^rules\s*:/.test(l));
        const block = ['rule-providers:', ...providerLines, ''];
        if (rulesIdx >= 0) {
          lines.splice(rulesIdx, 0, ...block);
        } else {
          lines.push('', ...block);
        }
      }
    }
  }

  if (override !== null || prepend.length > 0 || append.length > 0) {
    const rulesIdx = lines.findIndex((l) => /^rules\s*:/.test(l));
    if (rulesIdx < 0) {
      const merged = override !== null ? override : [...prepend, ...append];
      if (merged.length > 0) {
        lines.push('', 'rules:', ...formatRuleLines(merged));
      }
    } else {
      let endIdx = lines.length;
      for (let i = rulesIdx + 1; i < lines.length; i++) {
        if (/^[A-Za-z0-9_-]+\s*:/.test(lines[i])) {
          endIdx = i;
          break;
        }
      }
      const section = lines.slice(rulesIdx + 1, endIdx);
      const existingRuleLines = section.filter((l) => l.trim() !== '');
      const sampleIndentMatch = existingRuleLines.find((l) => /^\s*-\s+/.test(l))?.match(/^(\s*)-\s+/);
      const indent = sampleIndentMatch ? sampleIndentMatch[1] : '  ';

      let nextSection;
      if (override !== null) {
        nextSection = formatRuleLines(override, indent);
      } else {
        nextSection = [...section];
        if (prepend.length > 0) {
          const firstRulePos = nextSection.findIndex((l) => /^\s*-\s+/.test(l));
          const insertAt = firstRulePos >= 0 ? firstRulePos : 0;
          nextSection.splice(insertAt, 0, ...formatRuleLines(prepend, indent));
        }
        if (append.length > 0) {
          const matchIdx = nextSection.findIndex((l) => /^\s*-\s+['"]?(MATCH|FINAL)\b/i.test(l));
          const insertAt = matchIdx >= 0 ? matchIdx : nextSection.length;
          nextSection.splice(insertAt, 0, ...formatRuleLines(append, indent));
        }
      }
      lines.splice(rulesIdx + 1, endIdx - (rulesIdx + 1), ...nextSection);
    }
  }

  return lines.join('\n');
}

function mergeSingleXrayProfile(profile, ext) {
  if (!profile || typeof profile !== 'object') return profile;
  const next = structuredClone(profile);

  if (Array.isArray(ext.outbounds_append) && ext.outbounds_append.length > 0) {
    if (!Array.isArray(next.outbounds)) next.outbounds = [];
    const existingTags = new Set(next.outbounds.map((o) => o && o.tag).filter(Boolean));
    for (const ob of ext.outbounds_append) {
      if (ob && (!ob.tag || !existingTags.has(ob.tag))) {
        next.outbounds.push(ob);
        if (ob.tag) existingTags.add(ob.tag);
      }
    }
  }

  if (!next.routing || typeof next.routing !== 'object') {
    next.routing = {};
  }
  const currentRules = Array.isArray(next.routing.rules) ? next.routing.rules : [];

  if (Array.isArray(ext.override_rules)) {
    next.routing.rules = [...ext.override_rules];
  } else {
    const prepend = Array.isArray(ext.prepend_rules) ? ext.prepend_rules : [];
    const append = Array.isArray(ext.append_rules) ? ext.append_rules : [];
    next.routing.rules = [...prepend, ...currentRules, ...append];
  }

  return next;
}

export function mergeXrayRouting(jsonText, ext) {
  if (!jsonText || !ext || typeof ext !== 'object') return jsonText;
  const parsed = parseJsonSafe(jsonText);
  if (!parsed) return jsonText;

  const merged = Array.isArray(parsed)
    ? parsed.map((item) => mergeSingleXrayProfile(item, ext))
    : mergeSingleXrayProfile(parsed, ext);

  return JSON.stringify(merged, null, 2);
}
