# Cloudflare 端扩展路由规则说明

`3xui-cf-pages` 已经在边缘 Function（`functions/_lib/routing.js`）预留了路由规则扩展能力，支持后续把自定义分流规则托管在 Cloudflare KV 上而无需修改 `3x-ui` 本身。

## 支持的 KV 键名

| KV Key | 生效目标 | JSON 结构示例 |
| :--- | :--- | :--- |
| `routing:clash` | 合并到 Clash / Mihomo YAML 订阅的 `rules:` 与 `rule-providers:` | 见 `examples/routing-clash.example.json` |
| `routing:xray` | 合并到 Xray JSON 订阅的 `routing.rules` 与 `outbounds` | 见 `examples/routing-xray.example.json` |
| `routing:ruleset:<name>` | 独立规则集托管接口，客户端可通过 `https://<CF域名>/rules/<name>` 拉取 | 纯文本 / YAML / JSON 规则内容 |

## 推送扩展规则到 KV

```bash
# 示例：写入 Clash 扩展规则
npx wrangler kv key put --namespace-id=<你的KV_ID> "routing:clash" --path=routing/examples/routing-clash.example.json --remote

# 示例：托管一个 Clash rule-provider 文件（随后可在订阅里引用 https://<CF域名>/rules/my-direct.yaml）
npx wrangler kv key put --namespace-id=<你的KV_ID> "routing:ruleset:my-direct.yaml" --path=./my-direct.yaml --remote
```
