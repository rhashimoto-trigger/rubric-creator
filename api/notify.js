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
    
    console.log('Notification request received:', { school, name, email, timestamp });
    
    // Slack Webhook URL（環境変数から取得）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('SLACK_WEBHOOK_URL not configured - skipping notification');
      return res.status(200).json({ success: true, message: 'Notification skipped' });
    }

    const message = `📝 ルーブリック作成アプリ利用\n時刻: ${timestamp}\n学校名: ${school}\n名前: ${name}\nメール: ${email}`;

    // Slackに送信
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });

    if (!slackResponse.ok) {
      console.error('Slack API error:', slackResponse.status, await slackResponse.text());
    } else {
      console.log('Slack notification sent successfully');
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Notification error:', error.message, error.stack);
    // エラーでもアプリは続行させる
    return res.status(200).json({ success: true, error: error.message });
  }
}
