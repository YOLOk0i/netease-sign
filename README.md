# 网易云音乐自动签到

每天北京时间 00:05 通过 GitHub Actions 自动签到，支持**飞书**推送通知。

> 本仓库基于 [a6b6c6d6/netease-sign](https://github.com/a6b6c6d6/netease-sign) 改造，
> 通知渠道由钉钉改为飞书群机器人，签到逻辑保持一致。

## 功能

| 任务 | 说明 |
|------|------|
| 云贝签到 | 每日签到领取云贝（云贝中心真实接口） |
| VIP 黑胶乐签 | 每日 VIP 签到 |
| VIP 成长值 | 自动领取可领成长值 |
| 飞书通知 | 签到完成推送消息卡片到飞书群 |

## 使用

### 1. 获取 Cookie

浏览器打开并登录 [music.163.com](https://music.163.com)，按 F12 打开开发者工具。

**方法：从 Network 复制（推荐）**
- 切到 **Network（网络）** 标签
- 刷新页面，或在页面上点击任意一首歌
- 在请求列表中找到任意一个到 `music.163.com` 的请求
- 点该请求 → 找到 **Request Headers（请求头）**
- 找到 `Cookie:` 那一行，**右键 → Copy value** 复制整段 Cookie 字符串

> 关键要有 `MUSIC_U` 和 `__csrf` 这两个字段，缺一不可。
> 从 Network 复制的 Cookie 最完整，包含 HttpOnly 类型。

### 2. 配置 GitHub Secrets

进入 Settings → Secrets and variables → Actions → **New repository secret**：

| Name | Value |
|------|-------|
| `NETEASE_COOKIE` | 上面复制的 Cookie 字符串（必填） |
| `FEISHU_WEBHOOK` | 飞书群机器人 Webhook 地址（选填） |
| `FEISHU_SECRET` | 飞书机器人加签密钥（选填，开了加签必填） |

### 3. 触发运行

- **自动**：每天 UTC 16:05（北京时间 00:05）、UTC 20:35（北京时间 04:35 兜底）
- **手动**：Actions → Netease Daily Sign → **Run workflow**

## 飞书通知设置（可选）

1. 在飞书群里进入 **设置 → 群机器人 → 添加机器人 → 自定义机器人**
2. 安全设置勾选**签名校验**，复制生成的密钥
   > ⚠️ 不要选「IP 白名单」—— GitHub Actions 的出口 IP 不固定，会被拦
3. 复制 Webhook 地址（`https://open.feishu.cn/open-apis/bot/v2/hook/xxxx`）
4. 到 GitHub Secrets 添加 `FEISHU_WEBHOOK` 和 `FEISHU_SECRET`

**本地自检**（不用等 GitHub Actions）：

```bash
node feishu-test.cjs "<webhook地址>" "<加签密钥>"
```

跑通会在群里收到一张绿色测试卡片，失败会打印具体原因。

设置后每次签到完成会推送一张消息卡片，含云贝签到状态、VIP 等级与成长值、签到与领取结果。
如果机器人不支持卡片，脚本会自动降级为纯文本推送。

## Cookie 过期

Cookie 有效期通常几周到几个月，过期后 GitHub Actions 运行会失败并邮件通知你，重新登录一次获取新的 Cookie 更新 Secret 即可。

## 注意事项

- **Fork 后需要手动启用 Actions**：进入 Actions 页，点 *I understand my workflows, go ahead and enable them*。
- GitHub 会对 60 天无活动的仓库停用定时触发，仓库里的 `keepalive.yml` 每周自动提交一次以维持激活状态，不需要可以直接删掉。
