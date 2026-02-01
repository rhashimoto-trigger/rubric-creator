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
    const { 
      type,
      school = '', 
      name = '', 
      email = '', 
      timestamp = '',
      rubricTitle = '',
      subject = '',
      grade = '',
      levels = '',
      criteriaCount = ''
    } = req.body || {};
    
    console.log('Notification request:', req.body);
    
    // Slack Webhook URL（環境変数から取得）
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    
    if (!webhookUrl) {
      console.log('SLACK_WEBHOOK_URL not configured');
      return res.status(200).json({ success: true });
    }

    // 通知メッセージを種類に応じて作成
    let message;
    if (type === 'rubric_generated') {
  message = `✅ ルーブリック生成完了
時刻: ${timestamp}
学校名: ${school}
名前: ${name}
ルーブリック名: ${rubricTitle}
科目: ${subject}
学年: ${grade}
評価段階: ${levels}段階
評価観点数: ${criteriaCount}個
評価観点: ${req.body.aspects || '不明'}`;
    } else {
      message = `📝 ルーブリック作成アプリ利用開始
時刻: ${timestamp}
学校名: ${school}
名前: ${name}
メール: ${email}`;
    }

    // Slackに送信
    const slackResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message })
    });

    if (!slackResponse.ok) {
      console.error('Slack error:', slackResponse.status);
    }

    return res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error:', error);
    // エラーでもアプリは続行
    return res.status(200).json({ success: true });
  }
}
