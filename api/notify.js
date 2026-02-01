export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // プリフライトリクエストへの対応
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { school, name, email, timestamp } = req.body;
    
    // Slack Webhook URL（環境変数から取得）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.error('SLACK_WEBHOOK_URL not configured');
      return res.status(200).json({ success: true }); // 通知失敗でもアプリは続行
    }

    const message = `📝 ルーブリック作成アプリ利用\n時刻: ${timestamp}\n学校名: ${school}\n名前: ${name}\nメール: ${email}`;

    // Slackに送信
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Slack notification error:', error);
    return res.status(200).json({ success: true }); // エラーでもアプリは続行
  }
}
```

## Vercelの環境変数設定

Vercelダッシュボードで以下の環境変数を設定してください：

1. **Settings** → **Environment Variables** で追加：
   - `ANTHROPIC_API_KEY`: Anthropic APIキー（必須）
   - `SLACK_WEBHOOK_URL`: Slack Webhook URL（オプション）

## ファイル構成
```
your-repository/
├── api/
│   ├── generate.js  ← ルーブリック生成API
│   └── notify.js    ← Slack通知API
├── src/
│   └── App.jsx
└── ...
