<h1 align="center">Parcel Pilot MCP</h1>

<p align="center">
  <strong>你的私有快递查询 MCP：扫码登录一次，之后让 AI 帮你查淘宝、京东、菜鸟物流。</strong>
</p>

<p align="center">
  <a href="README.en.md">English</a>
  ·
  <a href="#快速开始">快速开始</a>
  ·
  <a href="#mcp-工具">MCP 工具</a>
  ·
  <a href="#安全模型">安全模型</a>
</p>

<p align="center">
  <img alt="Node.js 20+" src="https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white" />
  <img alt="MCP stdio" src="https://img.shields.io/badge/MCP-stdio-blue" />
  <img alt="Playwright browser sessions" src="https://img.shields.io/badge/Playwright-browser%20sessions-2EAD33?logo=playwright&logoColor=white" />
  <img alt="License MIT" src="https://img.shields.io/badge/license-MIT-black" />
</p>

Parcel Pilot MCP 会用 Playwright Chromium 保存你的个人浏览器登录态，然后通过 MCP
把快递数据提供给 AI 客户端。你可以像这样问：

```text
查询我所有待收货快递
今天有没有已经签收的包裹？
帮我查一下上周淘宝订单的物流进度
```

它适合个人自用，可以跑在 Mac 本地，也可以跑在你自己的 Linux 服务器上。它不是
淘宝、京东或菜鸟的官方开放 API 接入。

## 功能亮点

| 功能 | 说明 |
| --- | --- |
| 本地优先登录 | 扫码登录发生在你自己的 Playwright Chromium profile 中。 |
| AI 可直接调用 | 通过 MCP stdio 暴露 `get_my_packages`、`track_package`、`get_delivered_today`。 |
| 多平台统一模型 | 淘宝、京东、菜鸟都会归一化成同一套快递记录格式。 |
| 可本地也可服务器 | 支持 macOS 本地运行，也支持 Docker 部署到私有 Linux 服务器。 |
| 不绕过风控 | 验证码、短信、滑块、风险提示都需要你手动完成。 |

## 返回示例

```json
{
  "packages": [
    {
      "id": "taobao-1234567890",
      "source": "taobao",
      "title": "USB-C 数据线",
      "status": "in_transit",
      "carrier": "菜鸟",
      "trackingNumber": "YT123456789CN",
      "lastEvent": "运输中预计今天送达",
      "updatedAt": "2026-05-08T09:00:00.000+08:00"
    }
  ]
}
```

## 平台状态

| 平台 | 状态 | 备注 |
| --- | --- | --- |
| 淘宝 | 已有浏览器登录态解析器 | 解析已买到宝贝订单页，可提取订单级物流摘要，例如“运输中预计今天送达”。 |
| 京东 | 已有浏览器登录态适配框架 | 登录和会话结构已接入，真实页面选择器需要用个人账号继续验证。 |
| 菜鸟 | 已有浏览器登录态适配框架 | 登录和会话结构已接入，真实页面选择器需要用个人账号继续验证。 |

电商站点页面经常变化，解析器后续需要按实际页面维护。

## 快速开始

```bash
npm install
npm run build
```

Playwright 会在 `npm install` 时安装 Chromium。Linux 上如果缺少系统依赖，可以执行：

```bash
npx playwright install-deps chromium
```

复制 `.env.example` 为 `.env`：

```bash
PACKAGE_ASSISTANT_DATA_DIR=./data
PACKAGE_ASSISTANT_PROFILE_DIR=./browser-profiles
PACKAGE_ASSISTANT_ARTIFACT_DIR=./var
PACKAGE_ASSISTANT_HEADLESS=true
PACKAGE_ASSISTANT_TIMEZONE=Asia/Shanghai
```

macOS 首次登录建议打开可见浏览器：

```bash
PACKAGE_ASSISTANT_HEADLESS=false node dist/cli/open-login-browser.js taobao
```

扫码并完成必要验证后，同步并查询：

```bash
node dist/cli/call-tool.js sync_packages '{"source":"taobao"}'
node dist/cli/call-tool.js get_my_packages
node dist/cli/call-tool.js track_package '{"packageId":"taobao-ORDER_ID"}'
```

## MCP 客户端配置

任意支持 MCP stdio 的客户端都可以这样配置：

```json
{
  "mcpServers": {
    "parcel-pilot": {
      "command": "node",
      "args": ["/absolute/path/parcel-pilot-mcp/dist/server.js"],
      "env": {
        "PACKAGE_ASSISTANT_DATA_DIR": "/absolute/path/parcel-pilot-mcp/data",
        "PACKAGE_ASSISTANT_PROFILE_DIR": "/absolute/path/parcel-pilot-mcp/browser-profiles",
        "PACKAGE_ASSISTANT_ARTIFACT_DIR": "/absolute/path/parcel-pilot-mcp/var",
        "PACKAGE_ASSISTANT_HEADLESS": "true",
        "PACKAGE_ASSISTANT_TIMEZONE": "Asia/Shanghai"
      }
    }
  }
}
```

## 首次登录流程

1. 让 AI 客户端调用 `login_taobao`、`login_jd` 或 `login_cainiao`。
2. 打开返回的 `screenshotPath`，通常在 `var/login/` 下。
3. 用手机扫码登录。
4. 手动完成验证码、短信、滑块或风控提示。
5. 调用 `sync_packages`。
6. 之后就可以问 `get_my_packages`、`track_package` 或 `get_delivered_today`。

如果二维码截图过期太快，或者登录页需要交互，可以通过 noVNC、SSH X forwarding
或桌面会话打开可见浏览器：

```bash
PACKAGE_ASSISTANT_HEADLESS=false npm run dev
```

## MCP 工具

| 工具 | 用途 |
| --- | --- |
| `login_taobao` | 打开或刷新淘宝登录流程，并返回登录截图等产物。 |
| `login_jd` | 打开或刷新京东登录流程，并返回登录截图等产物。 |
| `login_cainiao` | 打开或刷新菜鸟登录流程，并返回登录截图等产物。 |
| `sync_packages` | 从单个平台或所有已配置平台同步快递数据。 |
| `get_my_packages` | 查询归一化快递列表，可筛选待收货或已签收。 |
| `track_package` | 按 package id 查询某个包裹详情。 |
| `get_delivered_today` | 查询今天签收的包裹，按配置时区计算。 |

## 私有 Linux 服务器部署

推荐形态：

- Docker 和 Docker Compose。
- 只通过 SSH 访问。
- MCP 由同一台机器上的 AI 客户端通过 stdio 启动，或通过 SSH/VPN 使用。
- 不提供公开的无鉴权 HTTP 入口。

从本机部署：

```bash
./scripts/aliyun-deploy.sh user@your-server:/opt/parcel-pilot-mcp
```

在服务器上执行一次性登录和同步：

```bash
cd /opt/parcel-pilot-mcp
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_taobao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_jd
docker compose run --rm -T package-assistant node dist/cli/call-tool.js login_cainiao
docker compose run --rm -T package-assistant node dist/cli/call-tool.js sync_packages
```

如需交互式远程浏览器：

```bash
cd /opt/parcel-pilot-mcp
docker compose run --rm --service-ports package-assistant ./scripts/remote-browser.sh taobao
ssh -N -L 6080:127.0.0.1:6080 user@your-server
```

然后打开：

```text
http://127.0.0.1:6080/vnc.html?autoconnect=true&resize=scale
```

通过 SSH 调用服务器上的 MCP：

```json
{
  "mcpServers": {
    "parcel-pilot": {
      "command": "ssh",
      "args": [
        "user@your-server",
        "cd /opt/parcel-pilot-mcp && docker compose run --rm -T package-assistant"
      ]
    }
  }
}
```

## 安全模型

请把 `browser-profiles/` 当成“已经登录的浏览器”来保护。

- 不要提交 `data/`、`var/`、`browser-profiles/`、`.env` 或 `tmp-login/`。
- 不要把 MCP 进程、noVNC 或临时登录浏览器暴露到公网。
- 只建议用于你自己的账号和你自己控制的机器。
- 拿到浏览器 profile 的人，可能可以看到订单、物流、收货地址和账号页面。
- 本项目不会绕过验证码、滑块、短信验证或平台风控。
- 建议关闭小额免密支付、自动扣款、极速下单等低摩擦支付/下单能力，降低登录态被滥用时的风险。

## 开发

```bash
npm test
npm run build
```

常用本地命令：

```bash
npm run call-tool -- get_my_packages
npm run call-tool -- sync_packages '{"source":"taobao"}'
```

## 路线图

- 用更多真实账号页面完善京东和菜鸟选择器。
- 增加商品名、地址等敏感字段的可选脱敏。
- 增加登录态过期、风控页、空页面等 provider 健康诊断。
- 增加 Claude Desktop、Codex 等 MCP 客户端配置示例。

## License

MIT
