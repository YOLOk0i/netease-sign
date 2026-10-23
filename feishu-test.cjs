#!/usr/bin/env node
/**
 * 飞书群机器人连通性测试（不依赖 WorkBuddy 连接器、不需要任何应用权限）
 *
 * 用法：
 *   node feishu-test.cjs "<webhook地址>" ["<加签密钥>"]
 *   或者先设环境变量：
 *   set FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxxx
 *   set FEISHU_SECRET=xxxx        （机器人没开加签就不用设）
 *   node feishu-test.cjs
 */
const crypto = require("crypto");

const webhook = process.argv[2] || process.env.FEISHU_WEBHOOK;
const secret = process.argv[3] || process.env.FEISHU_SECRET || "";

if (!webhook) {
  console.error("缺少 webhook 地址。用法：node feishu-test.cjs \"<webhook>\" [\"<secret>\"]");
  process.exit(1);
}

// 飞书加签：key 是 "时间戳\n密钥"，消息体为空；时间戳为秒级
function withSign(payload) {
  if (!secret) return payload;
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = crypto.createHmac("sha256", `${timestamp}\n${secret}`).digest("base64");
  return { ...payload, timestamp: String(timestamp), sign };
}

async function post(payload, label) {
  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withSign(payload)),
  });
  const data = await res.json().catch(() => ({}));
  const ok = data.code === 0 || data.StatusCode === 0;
  console.log(`[${label}] HTTP ${res.status} → ${JSON.stringify(data)}`);
  return ok;
}

(async () => {
  console.log(`webhook: ${webhook.slice(0, 60)}...  加签: ${secret ? "已启用" : "未启用"}`);

  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  const cardOk = await post(
    {
      msg_type: "interactive",
      card: {
        config: { wide_screen_mode: true },
        header: {
          template: "green",
          title: { tag: "plain_text", content: "🎵 飞书推送连通性测试" },
        },
        elements: [
          {
            tag: "div",
            text: { tag: "lark_md", content: `**如果你看到这条卡片，说明 webhook 和加签配置都没问题。**\n时间：${now}` },
          },
          { tag: "note", elements: [{ tag: "plain_text", content: "接下来把同样的地址填进 GitHub Secrets 即可" }] },
        ],
      },
    },
    "卡片"
  );

  if (cardOk) {
    console.log("\n✅ 测试通过，可以直接去配 GitHub Secrets 了。");
    return;
  }

  console.log("\n卡片发送失败，降级测试纯文本…");
  const textOk = await post(
    { msg_type: "text", content: { text: `飞书推送测试 ${now}` } },
    "文本"
  );

  if (textOk) {
    console.log("\n✅ 文本可发。说明机器人不支持消息卡片（或卡片被限制），把 sign.js 里的卡片换成 text 即可。");
  } else {
    console.log(
      "\n❌ 两种都失败。常见原因：\n" +
        "  1. webhook 地址复制不完整（少了尾部 token）\n" +
        "  2. 机器人开了加签但没传密钥，或密钥填错\n" +
        "  3. 安全设置里填了「IP 白名单」（GitHub Actions 的 IP 不固定，必然被拦）\n" +
        "  4. 安全设置里填了「自定义关键词」，消息内容不含该关键词"
    );
  }
})();
