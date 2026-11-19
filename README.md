# 3xui-cf-pages

用于配合 [3xui-cf-sync](../3xui-cf-sync) 将 `3x-ui` 订阅彻底迁出源站并托管到 **Cloudflare Pages + KV** 的前端展示与边缘分发项目。

> 仓库内**不包含任何节点 IP、UUID、账号或订阅秘钥**，可放心绑定 GitHub 自动部署到 Cloudflare Pages。

## 核心特性

1. **同一 URL 多端自适应**（`https://<你的CF域名>/<subId>`）：
   - **浏览器打开**：渲染订阅信息页（状态、已用/总流量进度条、到期时间、一键导入按钮、节点单独复制）。
   - **代理客户端请求**（Clash / Mihomo / v2rayN / Shadowrocket / sing-box 等）：根据 `User-Agent` 或 `?format=clash|raw|json` 返回对应配置正文，并注入 `Subscription-Userinfo`、`Profile-Title`、`Profile-Update-Interval` 响应头。
   - **根路径 `/` 与无效 `<subId>`**：统一返回 `404`，不暴露站点用途与用户列表。
2. **预留边缘路由规则扩展**：
   - 支持从 KV 读取 `routing:clash`、`routing:xray` 在下发订阅时动态注入自定义分流规则；
   - 支持通过 `https://<你的CF域名>/rules/<ruleset>` 托管自定义 Clash / sing-box 规则集（详情见 [routing/README.md](routing/README.md)）。

## Cloudflare Pages 部署步骤（GitHub 自动部署）

1. 在 Cloudflare Dashboard → **Storage & Databases → Workers KV** 创建一个 KV Namespace（例如命名为 `3xui-sub-kv`）。
2. 进入 **Workers & Pages → Create → Pages → Connect to Git**，选择你的 `3xui-cf-pages` GitHub 仓库：
   - **Build command**：留空（纯原生静态资源 + Pages Functions，无需构建）
   - **Build output directory**：`public`
3. 部署后进入该 Pages 项目的 **Settings → Functions → KV namespace bindings**：
   - Variable name：`SUB_KV`
   - KV namespace：选择第 1 步创建的 `3xui-sub-kv`
4. （可选）在 **Settings → Environment variables** 配置：
   - `PUBLIC_DOMAIN`：你的自定义 CF 域名（如 `https://sub.example.com`）
   - `SUB_PREFIX`：订阅路径前缀（默认空，即 `/<subId>`；填 `s` 则为 `/s/<subId>`）
   - `ENABLE_EXT_ROUTING`：`true` / `false`
5. 在 **Custom domains** 绑定你自己的域名即可（建议绑定自定义域名，避免 `pages.dev` 在部分地区被干扰）。

## 本地测试

```bash
node --test tests/handler.test.mjs
```
